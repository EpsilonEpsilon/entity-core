# entity-core

Сервис, который запускает AI-персон в мессенджерах. Одна персона может иметь несколько аккаунтов на разных платформах; на каждый аккаунт поднимается свой runtime. Входящее сообщение → планировщик (Gemini) выбирает набор действий → резолвер их выполняет.

Учебный проект. Часть проблем ниже отложена осознанно — см. [Бэклог](#бэклог).

## Как это работает

```
TelegramRuntime ──$events──▶ Preprocessor ──▶ EventHandler ──┬──▶ NewMessagePipeline ──▶ история
                                                              └──▶ IncomingMessagePipeline
                                                                        │
                                                          Planner ──▶ Gemini ──▶ IPlan[]
                                                                        │
                                                                   PlanResolver
                                                                        │
                                                                   Capability.execute()
                                                                        │
                                                          (исходящее сообщение → снова в $events)
```

**Capability** — единственный словарь системы. Один класс несёт и контракт для модели (`name`, `description`, Zod-`schema`), и исполнение (`execute(args, input)`), где `args` подставляет runtime, а `input` заполняет модель. Абстрактный класс держит контракт, платформенный наследник — вызов SDK.

Словарь собирается как объединение двух источников:

```ts
[...platform.getAllCapabilities(), ...appCapabilitiesRegistry.getRegistry()]
```

Платформенные приходят из подключённого runtime и зависят от платформы, приложенческие (`AppDelayCapability`) есть всегда. Планировщик и резолвер оба *выводят* это объединение, а не объявляют — поэтому модели нельзя предложить то, чего runtime не умеет.

Подробная схема со всеми связями: [architecture.html](architecture.html) — открыть в браузере.

## Стек

NestJS · TypeORM + PostgreSQL · RxJS · Zod · `@google/genai` (Gemini) · gramJS (`telegram`)

## Запуск

```bash
yarn install
```

`.env` в корне:

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
GEMINI_API_KEY=
TELEGRAM_APP_ID=
TELEGRAM_API_HASH=
```

База `entity-core` должна существовать; схема создаётся сама (`synchronize: true`).

```bash
yarn start:dev
```

Получить Telegram session string — [src/scripts/tg_connect.ts](src/scripts/tg_connect.ts) (сейчас `apiId`/`apiHash` в нём захардкожены пустыми, заполнить перед запуском). Полученную строку положить в `account.credentials`.

---

# Бэклог

Порядок — по принципу «сначала то, что искажает обратную связь, потом то, что дорожает со временем». Внутри этапа задачи независимы.

## Этап 0 — баги, из-за которых система ведёт себя не так, как кажется

Самое дешёвое и самое важное для учебного проекта: пока это не починено, наблюдения за поведением персоны недостоверны.

- [ ] **`AppDelayCapability.execute()` пустой** — [app-delay-capability.ts:15](src/core/app-capabilities/capabilities/app-delay-capability.ts). Тело `{}`, паузы нет вообще. Добавить `await delay(input.delay)` (утилита уже есть в [utils.ts](src/utils.ts)). *~5 мин*
- [ ] **`ReadMessageCapability.execute()` — конкретная заглушка** вместо `abstract` — [read-meassage-capability.ts:23](src/common/capability/capabilities/read-meassage-capability.ts). Telegram её переопределяет, но следующая платформа молча получит «успех», ничего не сделав. Сделать `abstract execute(...)`. *~5 мин*
- [ ] **План модели не валидируется** — [incoming-message-reaction-planner.service.ts:52](src/core/planner/planners/incoming-message-reaction-planner.service.ts). Zod используется только для генерации JSON Schema; `.parse()` на ответе не вызывается, а `JSON.parse(response.text || '')` падает на пустом ответе. Собрать схему плана и распарсить ответ — заодно станет видно, где именно Gemini не соблюдает контракт. *~1 час*
- [ ] **Неизвестные имена молча проглатываются** — [plan-resolver.service.ts:29](src/core/planner/plan-resolver.service.ts): `compatibility?.execute(...)`. Галлюцинация в `name` не даёт ни ошибки, ни лога. После предыдущего пункта заменить `?.` на явный throw. *~10 мин*

## Этап 1 — конкурентность и история (делать вместе)

Сейчас каждое сообщение — независимый цикл. Три задачи, которые часто путают:

| | проблема | инструмент |
|---|---|---|
| порядок | сообщения одного чата обрабатываются вперемешку | `groupBy` + `concatMap` |
| склейка | три сообщения подряд → три отдельных ответа | debounce перед планированием |
| прерывание | сообщение пришло посреди исполнения плана | прерывание между шагами плана |

- [ ] **Сериализация по диалогу** — [runtime-orchestrator.service.ts:15](src/core/runtime-orchestrator/runtime-orchestrator.service.ts). `mergeMap` → `groupBy(conversationKey)` + `concatMap`. Ключ группы должен быть стабильной строкой — сейчас в `ConversationRef` для этого годится `meta.chat.platformChatId`. Добавить duration-селектор, иначе группы копятся вечно. *~полдня*
- [ ] **Планировщик читает историю вместо одного сообщения** — сейчас на входе `ISendMessagePlannerContext { receivedMessage: string }`. Заменить на чтение последних N записей из `messages` (они уже пишутся, сортировка по `createdAt ASC` уже есть). Это бесплатно решает склейку: несколько сообщений за окно — просто несколько строк в контексте. *~полдня*
- [ ] **Ошибки пайплайнов теряются** — `void this.…Pipeline.process(...)` в [platform-event-handler.service.ts](src/core/platform-event-handler/platform-event-handler.service.ts). Любое исключение внутри исчезает. Ловить и логировать. *~20 мин*

> ⚠️ При сериализации помнить: исходящие сообщения возвращаются в `$events` через `messageSubject`, то есть попадут в ту же очередь, что и входящее, которое их породило. Сейчас безопасно (`events.next()` синхронный, никто его не ждёт), но если когда-нибудь захочется дождаться записи исходящего внутри резолвера — получится дедлок на своей же очереди. Ветку «запись в историю» лучше держать вне очереди планирования.

## Этап 2 — типы должны защищать дизайн

- [ ] **Генерики `Capability` не ограничены** — [capability.ts:3](src/common/capability/capability.ts): `Capability<T = unknown, S = unknown>`. Из-за этого точка диспетчеризации в резолвере не типизирована вообще — туда компилируется `execute(42, {что угодно})`. Ограничить `S extends ZodType`, `execute(args: TArgs, input: z.infer<TSchema>)`. *~1 час*
- [ ] **`anyOf` → `z.discriminatedUnion('name', …)`**, и удалить [planner.d.ts](src/core/planner/planner.d.ts). `IPlan` — глобальный ambient-тип (файл без импортов/экспортов), а его индексная сигнатура `string | number` не описывает вложенные объекты. Тип плана должен выводиться из схемы. *~1 час*
- [ ] **`implements` vs `extends` вразнобой** — `MessageCapability` и `ReadMessageCapability` используют `implements Capability`, `TypingCapability` и `AppCapability` — `extends`. Значит `TelegramMessageCapability instanceof Capability === false`. Работает только потому, что `get()` проверяет конкретный подкласс. Привести к `extends` везде. *~10 мин*
- [ ] **`strict: true`** в [tsconfig.json](tsconfig.json) (сейчас выключен вместе с `noImplicitAny`). Делать после предыдущих пунктов — большая часть ошибок отвалится сама. *~полдня*

## Этап 3 — устойчивость

- [ ] **Промисы в бутстрапе не ожидаются** — [app-bootstrap.service.ts:20](src/core/app-bootstrap/app-bootstrap.service.ts): `contexts.map(async …)` без `await`. Протухшая сессия или отсутствующий `platform.sender` → unhandled rejection, и непонятно, какие персоны вообще стартовали. `Promise.allSettled` + лог по каждой. *~30 мин*
- [ ] **`capabilities` не инициализированы до `init()`** — [telegram-runtime.ts:31](src/core/platform/impl/telegram/telegram-runtime.ts). Любой вызов `getAllCapabilities()` до подключения даёт `undefined`. Инициализировать пустым массивом, добавить проверку состояния. *~20 мин*
- [ ] **Нет жизненного цикла** — `PlatformRuntimeConnectionState` объявляет `Disconnecting`/`Disconnected`, но метода `disconnect()` нет, подписки не отписываются, `main.ts` не вызывает `enableShutdownHooks()`. *~2 часа*

## Этап 4 — протечки слоёв

Пока платформа одна — не болит. Заболит ровно в момент добавления второй.

- [ ] **`ConversationRef` импортирует `EntityLike` из `telegram/define`** — [conversation-ref.ts:1](src/core/platform/common/conversation-ref.ts). Ядро напрямую знает про Telegram. `meta` уже платформенно-нейтральна, осталось поле `ref`.
- [ ] **`IPlatformSender = TelegramSender`** — [types.ts:3](src/core/platform/types.ts). Сделать размеченным объединением по `platform`, как и `AccountCredentials`.
- [ ] **`impl/telegram/types.ts` импортирует `ChatType` из entity** — [types.ts:2](src/core/platform/impl/telegram/types.ts). Платформенный слой смотрит в persistence; зависимость должна идти в другую сторону.
- [ ] **Поиск игнорирует колонку `platform`** — `findParticipantByPlatformId` и `findChatByPlatformChatId` фильтруют только по id, при том что уникальные индексы составные. Для Telegram-only корректно, для второй платформы — нет.

## Этап 5 — гигиена

- [ ] Опечатки в именах: `databse.module.ts` → `database.module.ts`, `read-meassage-capability.ts` → `read-message-capability.ts`, `PlaneResolverService` → `PlanResolverService`. Переименовывать через `git mv` (`forceConsistentCasingInFileNames` включён, macOS регистронезависима).
- [ ] Описание у `TypingCapability` начинается с «MessageCapability is the interface…» — копипаста, а текст уходит в промпт.
- [ ] Мёртвый код: пустой `AccountService`, неиспользуемые импорты, `zod-to-json-schema` в зависимостях (используется встроенный `z.toJSONSchema`), захардкоженные пустые `apiId`/`apiHash` в `tg_connect.ts`.
- [ ] Именование файлов: `platformRuntime.ts`, `conversation-ref.ts`, `new-message-pipeline.ts`, `Gemini.module.ts` — Nest-конвенция kebab-case.
- [ ] Тесты на чистую логику: резолвер, матчинг капабилити, валидация плана, `mapTelegramChat`. Jest уже настроен, тестов ноль.

## Этап 6 — прод (для учебного проекта можно отложить)

- [ ] `synchronize: true` → миграции. Сейчас в базе уже есть история сообщений, которую жалко.
- [ ] Валидация конфига — `zod` уже в зависимостях, `DATABASE_PORT` приходит строкой и читается как `number`.
- [ ] Секреты: session string лежит в `jsonb` в открытом виде (это полный доступ к аккаунту), и [telegram-runtime.ts:62](src/core/platform/impl/telegram/telegram-runtime.ts) логирует начало `api_hash`.
- [ ] Модель Gemini захардкожена в [gemini.service.ts:23](src/common/gemini/gemini.service.ts) — вынести в конфиг.
- [ ] Блок `telegram` в [configuration.ts](src/config/configuration.ts) нигде не читается (креды берутся из таблицы `account`) — убрать или задействовать.

---

`ARCHITECTURE_REVIEW.md` описывает состояние до рефакторинга капабилити и устарел — актуальная картина в [architecture.html](architecture.html) и здесь.
