# entity-core — Architecture Review

A review of design problems found in the current codebase, with concrete fixes for each.

**Scope:** all of `src/` (~50 files) plus build/infra config, as of the initial commit.

**Overall:** the core shape is sound — a perceive → decide → act loop with one runtime per persona-account, an LLM planner producing a declarative plan, and a resolver executing it. The problems below are about abstractions that don't yet carry weight, missing error boundaries, and leaks between layers. None of them require rethinking the loop itself.

---

## Contents

| # | Problem | Severity |
|---|---------|----------|
| 1 | [Capabilities and Actions are the same concept, duplicated](#1-capabilities-and-actions-are-the-same-concept-duplicated) | High |
| 2 | [`actions` is hardcoded per-runtime instead of derived from capabilities](#2-actions-is-hardcoded-per-runtime-instead-of-derived-from-capabilities) | High |
| 3 | [Missing capabilities fail silently](#3-missing-capabilities-fail-silently) | High |
| 4 | [`ConversationRef` is a cast-laundering channel, not an abstraction](#4-conversationref-is-a-cast-laundering-channel-not-an-abstraction) | High |
| 5 | [Core depends on Telegram in three places](#5-core-depends-on-telegram-in-three-places) | High |
| 6 | [Floating promises on the hot path](#6-floating-promises-on-the-hot-path) | High |
| 7 | [No per-conversation serialization](#7-no-per-conversation-serialization) | High |
| 8 | [LLM output is trusted without validation](#8-llm-output-is-trusted-without-validation) | High |
| 9 | [`capabilities` is undefined until `init()`](#9-capabilities-is-undefined-until-init) | Medium |
| 10 | [No runtime lifecycle: no disconnect, teardown, or reconnect](#10-no-runtime-lifecycle-no-disconnect-teardown-or-reconnect) | Medium |
| 11 | [Event dispatch is an `instanceof` chain](#11-event-dispatch-is-an-instanceof-chain) | Medium |
| 12 | [Type-system erosion: the abstractions don't constrain anything](#12-type-system-erosion-the-abstractions-dont-constrain-anything) | Medium |
| 13 | [`TelegramRuntime` DI registration is dead and misleading](#13-telegramruntime-di-registration-is-dead-and-misleading) | Medium |
| 14 | [The persona has no state](#14-the-persona-has-no-state) | Medium |
| 15 | [Database: `synchronize: true`, no migrations](#15-database-synchronize-true-no-migrations) | Medium |
| 16 | [Secrets stored and logged in plaintext](#16-secrets-stored-and-logged-in-plaintext) | Medium |
| 17 | [No config validation](#17-no-config-validation) | Low |
| 18 | [`strict` mode is off](#18-strict-mode-is-off) | Low |
| 19 | [Zero tests](#19-zero-tests) | Low |
| 20 | [Dead code, naming, and consistency](#20-dead-code-naming-and-consistency) | Low |

[Suggested sequencing →](#suggested-sequencing)

---

## 1. Capabilities and Actions are the same concept, duplicated

**Where:** `src/common/capability/capabilities.enum.ts`, `src/core/platform/platform-action/platform-action.enum.ts`

Two parallel taxonomies map 1:1 onto each other:

```
CapabilityEnum     { message,     typing }
PlatformActionEnum { sendMessage, typing }
```

Every action's `resolve()` does exactly one thing — look up its capability and delegate:

```ts
// message-send.action.ts:38
await context.platform.get(MessageCapability)?.execute({ ... });
```

The distinction that would justify two layers — *capability = what the platform can do*, *action = what the planner may choose* — isn't being exploited. The result is that adding one persona ability (say, emoji reactions) requires editing **six files**:

1. `capabilities.enum.ts`
2. `common/capability/capabilities/reaction-capability.ts`
3. `core/platform/impl/telegram/capabilities/telegram-reaction-capability.ts`
4. `platform-action.enum.ts`
5. `core/platform/platform-action/actions/reaction.action.ts`
6. `telegram-runtime.ts` (to append to the `actions` array)

### Fix

Keep both layers, but make the relationship explicit and one-directional: an **action declares the capability it requires**, and nothing else couples them.

```ts
// core/action/action.abstract.ts
export abstract class Action<TPayload> {
  abstract readonly actionName: string;
  abstract readonly description: string;
  abstract readonly schema: z.ZodType<TPayload>;

  /** Capability this action needs; `null` for pure system actions. */
  abstract readonly requires: AbstractType<Capability> | null;

  abstract resolve(
    ctx: RuntimeContext,
    payload: TPayload,
    exec: ActionExecutionContext,
  ): Promise<void>;
}
```

```ts
// core/platform/platform-action/actions/message-send.action.ts
export class MessageSendAction extends PlatformAction<{ message: string }> {
  readonly actionName = PlatformActionEnum.sendMessage;
  readonly requires = MessageCapability;
  // ...
}
```

Now steps 4–6 above collapse into "add the action to one registry", and the enums stop needing to stay in sync by hand.

---

## 2. `actions` is hardcoded per-runtime instead of derived from capabilities

**Where:** `src/core/platform/impl/telegram/telegram-runtime.ts:29`

```ts
public actions = [new MessageSendAction(), new TypingAction()];
```

`MessageSendAction` and `TypingAction` are entirely platform-agnostic — they never touch Telegram, only capabilities. So this list has to be re-declared, identically, by every future platform.

Worse, it makes the capability-discovery machinery on `PlatformRuntime` a no-op:

```ts
// platformRuntime.ts:22-34
public get<T extends Capability<any>>(capability: AbstractType<T>): T | undefined
public has(capability: AbstractType<Capability>)
```

Nothing ever calls `has()`. And `capabilities` is a fixed tuple (`telegram-runtime.ts:30`), so it can never vary at runtime anyway. The system *looks* like it does capability negotiation; it doesn't.

### Fix

One global action registry. The runtime advertises capabilities only; available actions are computed.

```ts
// core/action/action.registry.ts
export const ALL_ACTIONS: readonly Action<any>[] = [
  new MessageSendAction(),
  new TypingAction(),
  new DelayAction(),
];

export function actionsFor(runtime: PlatformRuntime): Action<any>[] {
  return ALL_ACTIONS.filter((a) => a.requires === null || runtime.has(a.requires));
}
```

```ts
// platformRuntime.ts — actions are no longer a runtime concern
export abstract class PlatformRuntime {
  protected abstract capabilities: Capability[];
  // delete: public abstract readonly actions
}
```

Then `plan-resolver.service.ts` and `send-message-planner.service.ts` both call `actionsFor(context.platform)` instead of spreading `context.platform.actions` with `systemActions`. Adding a platform becomes purely additive: implement the capabilities you support, and the action set follows.

---

## 3. Missing capabilities fail silently

**Where:** `message-send.action.ts:38`, `typing.action.ts:38`

```ts
await context.platform.get(MessageCapability)?.execute({ ... });
return Promise.resolve();
```

If the platform doesn't provide the capability, the optional chain swallows it: the action **does nothing and reports success**. The planner gets no feedback and will keep choosing that action forever. This is the failure mode that will be hardest to diagnose in production, because it produces no log line, no exception, and no metric.

### Fix

With fix #2 in place, an action without its capability can never be offered to the planner — so reaching `resolve()` means an invariant was violated. Fail loudly:

```ts
async resolve(ctx: RuntimeContext, payload: { message: string }, exec: ActionExecutionContext) {
  const capability = ctx.platform.get(MessageCapability);
  if (!capability) {
    throw new Error(
      `${this.actionName} requires MessageCapability, which ${ctx.account.platform} does not provide`,
    );
  }
  if (!exec.conversation) throw new Error(`${this.actionName} requires a conversation`);

  await capability.execute({ answer: payload.message, conversation: exec.conversation });
}
```

Better still, hoist the lookup into a small base class so no action has to remember the guard:

```ts
// core/platform/platform-action/capability-action.abstract.ts
export abstract class CapabilityAction<TPayload, TCap extends Capability<any>>
  extends PlatformAction<TPayload> {
  abstract readonly requires: AbstractType<TCap>;

  protected capabilityFor(ctx: RuntimeContext): TCap {
    const cap = ctx.platform.get(this.requires);
    if (!cap) throw new MissingCapabilityError(this.actionName, this.requires.name);
    return cap;
  }
}
```

---

## 4. `ConversationRef` is a cast-laundering channel, not an abstraction

**Where:** `src/core/platform/common/ConversationRef.ts`

```ts
export class ConversationRef {
  constructor(public id: unknown) {}
}
```

Telegram puts a live SDK object into it:

```ts
// telegram-runtime.ts:75
new ConversationRef(await event.message.getInputChat())
```

…and every consumer casts it straight back out:

```ts
// telegram-message-capability.ts:16
await this.client.sendMessage(args.conversation.id as EntityLike, { ... });
```

So a raw Telegram object travels through the entire domain layer wrapped in `unknown`. What this costs you: a conversation cannot be serialized, persisted, logged, compared for equality, or routed on. The moment you want "resume conversations after restart", "don't double-reply to the same chat", or "rate-limit per conversation", this is the blocker.

### Fix

Make it a serializable value object, and keep native handle resolution inside the runtime.

```ts
// core/platform/common/conversation-ref.ts
export class ConversationRef {
  constructor(
    public readonly platform: PlatformType,
    public readonly externalId: string,
  ) {}

  get key(): string {
    return `${this.platform}:${this.externalId}`;
  }

  equals(other: ConversationRef): boolean {
    return this.key === other.key;
  }
}
```

```ts
// telegram-runtime.ts — construct from a stable id
new ConversationRef(PlatformType.telegram, event.message.chatId!.toString())
```

```ts
// telegram-message-capability.ts — resolve the native handle here
async execute(args: Params) {
  const peer = await this.client.getInputEntity(args.conversation.externalId);
  await this.client.sendMessage(peer, { message: args.answer });
}
```

`ConversationRef.key` then becomes the natural key for the per-conversation queue in fix #7 and for a `Conversation` table in fix #14.

---

## 5. Core depends on Telegram in three places

Three separate leaks of the concrete platform into layers that are supposed to be platform-agnostic.

**5a. The generic capability abstraction imports the Telegram SDK.**

```ts
// common/capability/capabilities/message-capability.ts:3-5
import { TelegramClient } from 'telegram';
import { EntityLike } from 'telegram/define';
```

Both are unused, but the dependency is declared and will be picked up by any dependency-graph tooling.

*Fix:* delete both imports.

**5b. The factory hardcodes every implementation.**

```ts
// platform-runtime.factory.ts:10-12
constructor(private moduleRef: ModuleRef) {
  this.platformMap = { [PlatformType.telegram]: TelegramRuntime };
}
```

The abstraction layer imports every impl, so `PlatformModule` can never be built without knowing about all platforms.

*Fix:* invert it with a DI token each platform module contributes to.

```ts
// core/platform/platform-runtime.token.ts
export const PLATFORM_RUNTIME = Symbol('PLATFORM_RUNTIME');
export interface PlatformRuntimeRegistration {
  platform: PlatformType;
  runtime: Type<PlatformRuntime>;
}
```

```ts
// impl/telegram/telegram.module.ts
@Module({
  providers: [
    {
      provide: PLATFORM_RUNTIME,
      useValue: { platform: PlatformType.telegram, runtime: TelegramRuntime },
    },
  ],
  exports: [PLATFORM_RUNTIME],
})
export class TelegramModule {}
```

```ts
// platform-runtime.factory.ts
@Injectable()
export class PlatformRuntimeFactory {
  private readonly map: Map<PlatformType, Type<PlatformRuntime>>;

  constructor(
    @Inject(PLATFORM_RUNTIME) registrations: PlatformRuntimeRegistration[],
    private moduleRef: ModuleRef,
  ) {
    this.map = new Map(registrations.map((r) => [r.platform, r.runtime]));
  }

  public async get(platform: PlatformType): Promise<PlatformRuntime> {
    const impl = this.map.get(platform);
    if (!impl) throw new Error(`Unknown platform: ${platform}`);
    return this.moduleRef.create(impl);
  }
}
```

Note this also fixes an unreachable guard: the current `if (!impl) throw new Error('Unknown platform')` sits *after* `moduleRef.create()`, which would already have thrown on an unknown platform. The check belongs on the map lookup.

**5c. The account model *is* the Telegram credential shape.**

```ts
// entities/account/types.d.ts:7
export type AccountCredentials = TelegramCredentials;
```

There's a latent trap here. `TelegramRuntime.init(credentials: TelegramCredentials)` narrows the base signature `init(credentials: AccountCredentials)`. Identical today, so it compiles. The day `AccountCredentials` becomes a union, TypeScript's method-parameter bivariance will let the narrowed override pass silently, and you'll get a runtime crash instead of a type error.

*Fix:* make it a discriminated union now and narrow explicitly inside `init`.

```ts
// entities/account/types.ts  (note: .ts, not .d.ts — see #20)
export interface TelegramCredentials {
  platform: PlatformType.telegram;
  api_id: number;
  api_hash: string;
  session: string;
}

export type AccountCredentials = TelegramCredentials; // | DiscordCredentials | ...
```

```ts
// telegram-runtime.ts — keep the base signature, narrow inside
public async init(credentials: AccountCredentials): Promise<void> {
  if (credentials.platform !== PlatformType.telegram) {
    throw new Error(`TelegramRuntime received ${credentials.platform} credentials`);
  }
  // credentials is now TelegramCredentials
}
```

---

## 6. Floating promises on the hot path

**Where:** `app-bootstrap.service.ts:15`, `runtime-orchestrator.service.ts:16`

```ts
// app-bootstrap.service.ts:15
contexts.forEach((ctx) => this.runtimeOrchestratorService.run(ctx));
```

`run()` awaits `platform.init()`, which throws on bad credentials (`telegram-runtime.ts:60`). Nothing catches it → unhandled rejection. One persona with a stale Telegram session can take down the process, and you get no report of which personas actually started.

```ts
// runtime-orchestrator.service.ts:16
context.platform.$events.subscribe((event) => {
  this.platformEventHandlerService.process(context, event); // async, unawaited
});
```

Every error thrown inside a pipeline — a Gemini timeout, a `JSON.parse` failure, a Telegram send error — becomes an unhandled rejection.

### Fix

Settle every promise and record the outcome.

```ts
// app-bootstrap.service.ts
async onApplicationBootstrap() {
  const contexts = (await this.createContext()).flat();
  const results = await Promise.allSettled(
    contexts.map((ctx) => this.runtimeOrchestratorService.run(ctx)),
  );

  results.forEach((result, i) => {
    const ctx = contexts[i];
    const label = `${ctx.personaContext.getEntity().name}/${ctx.account.platform}`;
    if (result.status === 'rejected') {
      this.logger.error(`Failed to start runtime for ${label}`, result.reason);
    } else {
      this.logger.log(`Started runtime for ${label}`);
    }
  });

  const started = results.filter((r) => r.status === 'fulfilled').length;
  this.logger.log(`${started}/${contexts.length} runtimes started`);
}
```

Decide deliberately whether zero started runtimes should be fatal — if so, throw here so the process exits instead of idling.

For the subscription, add an error boundary (and see #7, which replaces this entirely):

```ts
context.platform.$events.subscribe({
  next: (event) => {
    void this.platformEventHandlerService.process(context, event).catch((err) =>
      this.logger.error(`Error handling ${event.constructor.name}`, err),
    );
  },
  error: (err) => this.logger.error('Platform event stream failed', err),
});
```

---

## 7. No per-conversation serialization

**Where:** `runtime-orchestrator.service.ts:16`

Because `process()` is invoked and not awaited, 50 incoming messages produce 50 concurrent Gemini calls whose action plans interleave. A `TypingAction` for chat A and a `MessageSendAction` for chat B will race. For a system whose entire premise is *human-like* behaviour, this is the correctness bug most visible to end users: the persona will appear to type in one chat while answering another, reply out of order, or answer a follow-up before the original.

`DelayAction` makes it worse — it exists specifically to pace a plan, and unserialized execution defeats it.

### Fix

Serialize per conversation, keep different conversations concurrent. RxJS already gives you the tools:

```ts
// runtime-orchestrator.service.ts
public async run(context: RuntimeContext) {
  await context.platform.init(context.account.credentials);

  const subscription = context.platform.$events
    .pipe(
      groupBy((event) => this.conversationKey(event)),
      mergeMap((group$) =>
        group$.pipe(
          concatMap((event) =>
            from(this.platformEventHandlerService.process(context, event)).pipe(
              catchError((err) => {
                this.logger.error(`Error handling event in ${group$.key}`, err);
                return EMPTY;   // one bad event must not kill the group
              }),
            ),
          ),
        ),
      ),
    )
    .subscribe();

  this.subscriptions.set(context, subscription);   // see #10
}
```

`groupBy` + `concatMap` gives strict ordering within a conversation; the outer `mergeMap` keeps conversations independent. `ConversationRef.key` from fix #4 is the grouping key.

Two things to decide alongside this:

- **Unbounded groups.** `groupBy` retains a subject per key forever. Add a duration selector so idle conversations are reclaimed: `groupBy(keyFn, { duration: (g) => g.pipe(debounceTime(5 * 60_000)) })`.
- **Backpressure.** If a conversation floods, `concatMap` queues without limit. Consider dropping or coalescing when the queue exceeds a threshold.

---

## 8. LLM output is trusted without validation

**Where:** `send-message-planner.service.ts:56`, `plan-resolver.service.ts:19-22`

```ts
return JSON.parse(response.text || '');
```

Three problems in one line:

1. `JSON.parse('')` throws `SyntaxError` — the `|| ''` fallback converts "no response" into a crash rather than a handled case.
2. The parsed value is never validated. It's typed as `IPlan[]` by assertion only and fed straight into `resolve()`.
3. Nothing checks that the model returned an array at all.

Then in the resolver, an unrecognized action type is silently dropped:

```ts
// plan-resolver.service.ts:20-21
const action = actions.find((action) => action.actionName === item.type);
await action?.resolve(context, item, executionContext);
```

A hallucinated action type produces no error, no log, nothing.

You already have `zod` **and** `zod-to-json-schema` in `package.json` and use neither. Meanwhile action schemas are hand-written `@google/genai` `Schema` objects, which drags the AI vendor's types into `core/action/action.abstract.ts` — so every action definition is coupled to Gemini specifically.

### Fix

Make Zod the single source of truth, derive the provider schema from it, and validate on the way back.

```ts
// core/platform/platform-action/actions/message-send.action.ts
export class MessageSendAction extends PlatformAction<{ message: string }> {
  readonly actionName = PlatformActionEnum.sendMessage;
  readonly requires = MessageCapability;
  readonly description = 'Send a text message to the current conversation.';

  readonly schema = z.object({
    type: z.literal(PlatformActionEnum.sendMessage),
    message: z.string().min(1),
  });

  async resolve(ctx, payload, exec) { /* payload is fully typed and validated */ }
}
```

```ts
// core/planner/plan.schema.ts
export function buildPlanSchema(actions: readonly Action<any>[]) {
  const variants = actions.map((a) => a.schema);
  return z.array(z.discriminatedUnion('type', variants as any)).min(1).max(10);
}
```

```ts
// incoming-message-reaction-planner.service.ts
const planSchema = buildPlanSchema(actionsFor(context.platform));

const response = await this.gemini.generate(prompt, {
  responseMimeType: 'application/json',
  responseSchema: zodToJsonSchema(planSchema),   // derived, never hand-written
});

if (!response.text) {
  throw new EmptyPlannerResponseError(context.account.id);
}

const parsed = planSchema.safeParse(JSON.parse(response.text));
if (!parsed.success) {
  this.logger.warn(`Planner returned an invalid plan: ${parsed.error.message}`);
  throw new InvalidPlanError(parsed.error);
}
return parsed.data;
```

Wrap the `JSON.parse` itself in a try/catch — a truncated response is malformed JSON, not a schema violation, and the two deserve different log messages.

In the resolver, treat an unknown type as a real error:

```ts
for (const item of plan) {
  const action = actions.find((a) => a.actionName === item.type);
  if (!action) {
    this.logger.error(`Planner produced unknown action type "${item.type}"; aborting plan`);
    throw new UnknownActionError(item.type);
  }
  await action.resolve(context, item, executionContext);
}
```

Decide explicitly whether a mid-plan failure should abort the rest of the plan (probably yes — a plan is a sequence, and continuing after a failed step produces incoherent behaviour).

Once schemas are Zod, delete `import { Schema } from '@google/genai'` from `core/action/action.abstract.ts`. The core then has no knowledge of which LLM you use, and swapping providers touches only `ai/`.

---

## 9. `capabilities` is undefined until `init()`

**Where:** `telegram-runtime.ts:30`, `telegram-runtime.ts:83-88`

```ts
public capabilities: [TelegramMessageCapability, TelegramTypingCapability];  // no initializer
```

It's only populated by `initCapabilities()`, called at the end of `init()`. Any call to `get()` or `has()` before then throws `TypeError: Cannot read properties of undefined (reading 'find')`. There is no guard and no state check. This is currently masked only because nothing calls `has()` and `get()` is reached exclusively via the event stream — which can't emit before `init()`. It will surface the first time capabilities are inspected during setup, which is exactly what fix #2 does.

Two related notes:

- The base declares `protected abstract capabilities: Capability[]`; the subclass widens it to `public` and narrows it to a fixed tuple. The tuple type means the capability set is static, which is the other half of why capability negotiation is currently theatre.
- `PlatformRuntime.$events` (`platformRuntime.ts:17`) has the same shape of problem: a non-abstract property with no initializer. It compiles only because `strictPropertyInitialization` is off (see #18).

### Fix

Initialize to empty, and guard the state:

```ts
// platformRuntime.ts
export abstract class PlatformRuntime {
  public abstract readonly $events: Observable<PlatformEvent>;
  protected capabilities: Capability[] = [];
  public abstract connectionState: PlatformRuntimeConnectionState;

  public get<T extends Capability<any>>(capability: AbstractType<T>): T | undefined {
    this.assertReady();
    return this.capabilities.find((c) => c instanceof capability) as T | undefined;
  }

  public has(capability: AbstractType<Capability>): boolean {
    this.assertReady();
    return this.capabilities.some((c) => c instanceof capability);
  }

  private assertReady(): void {
    if (this.connectionState !== PlatformRuntimeConnectionState.Connected) {
      throw new Error(`Runtime is ${PlatformRuntimeConnectionState[this.connectionState]}, not Connected`);
    }
  }
}
```

If fix #2 needs to inspect capabilities *before* connecting, split the declaration from the binding: a static `supports(): CapabilityEnum[]` for negotiation, and the live instances only after `init()`.

---

## 10. No runtime lifecycle: no disconnect, teardown, or reconnect

**Where:** `platformRuntime.ts:8-14`, `runtime-orchestrator.service.ts`, `main.ts`

`PlatformRuntimeConnectionState` defines `Disconnecting` and `Disconnected`, but:

- there is no `disconnect()` method anywhere, so `Disconnecting` is unreachable;
- the subscription in `run()` is never stored and never unsubscribed;
- nothing implements `OnModuleDestroy`;
- `main.ts` never calls `enableShutdownHooks()`, and the `app` variable is unused;
- there is no reconnect path — if Telegram drops the connection, the runtime sits in `Connected` forever with a dead client.

Net effect: `SIGTERM` kills the process with in-flight plans half-executed and Telegram sessions not closed cleanly.

### Fix

```ts
// platformRuntime.ts
abstract init(credentials: AccountCredentials): Promise<void>;
abstract disconnect(): Promise<void>;
```

```ts
// telegram-runtime.ts
public async disconnect(): Promise<void> {
  if (this.connectionState !== PlatformRuntimeConnectionState.Connected) return;
  this.connectionState = PlatformRuntimeConnectionState.Disconnecting;
  try {
    await this.client.disconnect();
    this.events.complete();
  } finally {
    this.connectionState = PlatformRuntimeConnectionState.Disconnected;
    this.capabilities = [];
  }
}
```

```ts
// runtime-orchestrator.service.ts
@Injectable()
export class RuntimeOrchestratorService implements OnModuleDestroy {
  private readonly running = new Map<RuntimeContext, Subscription>();

  async onModuleDestroy() {
    await Promise.allSettled(
      [...this.running].map(async ([ctx, sub]) => {
        sub.unsubscribe();
        await ctx.platform.disconnect();
      }),
    );
    this.running.clear();
  }
}
```

```ts
// main.ts
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  app.enableShutdownHooks();
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap', err);
  process.exit(1);
});
```

For reconnect: have `TelegramRuntime` listen for the SDK's disconnect event, flip `connectionState`, and emit a `PlatformDisconnectedEvent` so the orchestrator can apply a backoff-retry policy. Keeping the retry policy in the orchestrator rather than the runtime means every platform gets it for free.

---

## 11. Event dispatch is an `instanceof` chain

**Where:** `platform-event-handler.service.ts:12-16`

```ts
process(context: RuntimeContext, event: PlatformEvent) {
  if (event instanceof IncomingMessagePlatformEvent) {
    return this.incomingMessagePipeline.process(context, event);
  }
}
```

Three issues:

- The `if`-chain grows linearly with event types and becomes a god-switch; the dispatcher must import every pipeline.
- Unmatched events fall through and return `undefined` silently.
- `PlatformEventHandlerService implements PipelineAbstract` — it's a *dispatcher*, not a pipeline. Conflating them means the type says nothing.

`PlatformEvent` also has no discriminant, so `instanceof` is the only option available today — and `instanceof` breaks the moment events cross a serialization boundary (a queue, a replay log).

### Fix

Add a discriminant and dispatch through a map.

```ts
// core/platform/events/platform-event.ts
export enum PlatformEventType {
  incomingMessage = 'incomingMessage',
  disconnected = 'disconnected',
}

export interface PlatformEvent {
  readonly kind: PlatformEventType;
  readonly platform: PlatformType;
}
```

```ts
// pipelines/pipeline.abstract.ts — make the generic actually load-bearing
export abstract class Pipeline<T extends PlatformEvent> {
  abstract readonly handles: T['kind'];
  abstract process(context: RuntimeContext, event: T): Promise<void>;
}
```

```ts
// platform-event-handler.service.ts
@Injectable()
export class PlatformEventHandlerService {
  private readonly pipelines: Map<PlatformEventType, Pipeline<any>>;

  constructor(@Inject(PIPELINE) pipelines: Pipeline<any>[]) {
    this.pipelines = new Map(pipelines.map((p) => [p.handles, p]));
  }

  async process(context: RuntimeContext, event: PlatformEvent): Promise<void> {
    const pipeline = this.pipelines.get(event.kind);
    if (!pipeline) {
      this.logger.warn(`No pipeline registered for event kind "${event.kind}"`);
      return;
    }
    await pipeline.process(context, event);
  }
}
```

---

## 12. Type-system erosion: the abstractions don't constrain anything

Individually small, but they compound — several of the interfaces currently hold nothing up.

**12a. `IPlan` is a global ambient type.**
`core/planner/planner.d.ts` has no imports or exports, so `IPlan` leaks into global scope — which is why `plan-resolver.service.ts` uses it without importing it. Its index signature also contradicts reality:

```ts
interface IPlan {
  type: string;
  [key: string]: string | number;   // but MessageSendAction's payload holds a ConversationRef
}
```

*Fix:* delete the file. With fix #8, the plan type is inferred from the Zod schema: `type Plan = z.infer<ReturnType<typeof buildPlanSchema>>`. If you keep a hand-written type, put it in a `.ts` module with a real `export`.

**12b. Action generics are decorative.**
`MessageSendAction extends PlatformAction<{ message: string; conversation: ConversationRef }>` but `resolve(context, actionPayload: { message: string }, ...)` — the declared payload and the actual one disagree, and the resolver casts everything to `Action<unknown>[]` anyway, so `T` never constrains a call site.

*Fix:* one payload type per action, derived from the Zod schema (`z.infer<typeof this.schema>`), with `conversation` living only in `ActionExecutionContext` where it belongs.

**12c. `PlannerInterface.plan` returns `void`.**

```ts
// planner.abstract.ts:4
plan: (context: RuntimeContext, plannerRequest: IContext) => void;
```

…while the implementation returns `Promise<IPlan[]>`. And `IncomingMessagePipeline` injects the concrete `SendMessagePlannerService` anyway, so the interface buys nothing.

*Fix:* `plan(context: RuntimeContext, request: TRequest): Promise<Plan>`, and inject the abstraction via a DI token if you actually intend to swap planners. Otherwise delete the interface — a one-implementation interface is a liability, not an abstraction.

**12d. `PipelineAbstract<T>`'s generic is ignored.**

```ts
export interface PipelineAbstract<T extends PlatformEvent = PlatformEvent> {
  process: (context: RuntimeContext, event: PlatformEvent) => void;   // T unused
}
```

`IncomingMessagePipeline implements PipelineAbstract<IncomingMessagePlatformEvent>` narrows the parameter in its own signature and TypeScript accepts it via method bivariance — meaning the interface would not catch a genuinely wrong event type. Covered by fix #11.

**12e. `MessageCapability` uses `implements`, `TypingCapability` uses `extends`.**

```ts
// message-capability.ts:7
export abstract class MessageCapability<T> implements Capability<T> {

// typing-capability.ts:4
export abstract class TypingCapability<T> extends Capability<T> {
```

So `TelegramMessageCapability instanceof Capability === false`. It works today only because `get()` tests against the specific subclass. Any future `instanceof Capability` check silently excludes all message capabilities.

*Fix:* `extends` in both.

**12f. Planner naming implies a design that doesn't exist.**
`SendMessagePlannerService` is named after an action but performs general planning — it decides among *all* available actions. The name suggests a plan-per-intent architecture that isn't there.

*Fix:* rename to `ConversationPlannerService` (or `ReactivePlannerService`), matching what it does.

---

## 13. `TelegramRuntime` DI registration is dead and misleading

**Where:** `telegram.module.ts:5-6`, `platform-runtime.factory.ts:15`

`TelegramRuntime` is declared `@Injectable()` and registered as a provider — i.e. a **singleton**. But actual instances come from `moduleRef.create()`, which builds a fresh, *unregistered* instance every time. So the provider registration is never used for its stated purpose, and anyone who injects `TelegramRuntime` directly gets a shared object that no one ever calls `init()` on — stuck in `Idle` with `capabilities === undefined` (see #9).

Since each persona-account needs its own connected client, per-instance creation is correct. The registration is the part that's wrong.

*Fix:* covered by the token-based registry in **5b** — the module exports a registration descriptor rather than the class as a provider, so there's no singleton to accidentally inject.

---

## 14. The persona has no state

**Where:** `entities/persona/persona.entity.ts`, `entities/persona/persona.context.ts`, `send-message-planner.service.ts:26-49`

`PersonaEntity` has `id`, `name`, and timestamps. `PersonaContext` exposes only `getEntity()`. So the planner prompt contains a name and a single message:

```
Persona:
- Name: ${context.personaContext.getEntity().name}
```

There is no conversation history, no persona traits, no memory, and no `Message` entity anywhere in the schema. `IncomingMessagePlatformEvent` even captures `senderId` — which the pipeline then discards.

The entire architecture is built to support a rich persona; the data model doesn't have one yet. This is the largest gap between what the system is *shaped* for and what it can currently do.

### Fix

Add the missing domain model:

```ts
@Entity('conversations')
export class ConversationEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'enum', enum: PlatformType }) platform: PlatformType;
  @Column() externalId: string;              // matches ConversationRef.externalId
  @ManyToOne(() => AccountEntity) account: AccountEntity;
  @OneToMany(() => MessageEntity, (m) => m.conversation) messages: MessageEntity[];
  @Index() @Column() lastActivityAt: Date;
}

@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => ConversationEntity, (c) => c.messages, { onDelete: 'CASCADE' })
  conversation: ConversationEntity;
  @Column({ type: 'enum', enum: MessageDirection }) direction: MessageDirection;
  @Column('text') body: string;
  @Column({ nullable: true }) externalSenderId: string | null;
  @Column({ nullable: true }) externalMessageId: string | null;
  @CreateDateColumn() createdAt: Date;
}
```

Add a unique index on `(platform, externalId)` for conversations and on `(conversation, externalMessageId)` for messages — the latter gives you idempotency if the platform redelivers an event.

Extend the persona with the traits the prompt should actually carry:

```ts
@Column('text') systemPrompt: string;
@Column('jsonb', { default: {} }) traits: Record<string, unknown>;
@Column('int', { default: 20 }) historyWindow: number;
```

Then widen the planner's input so it receives history rather than one string:

```ts
interface ConversationPlannerRequest {
  conversation: ConversationRef;
  incoming: MessageEntity;
  history: MessageEntity[];       // last N, oldest first
}
```

Two smaller notes in the same area:

- `PersonaContext.getEntity()` calls `structuredClone` on the full entity *on every access*, and the planner calls it twice per plan. Clone once in the constructor and return a frozen reference — or return a purpose-built read model instead of the ORM entity, which also stops relations from being dragged into the clone.
- `RuntimeContext` is a god object carrying `account` (**including credentials**), `personaContext`, and `platform`, and it's passed to every action. Actions have no business reading credentials. Consider narrowing what `resolve()` receives to `{ persona, platform, conversation }`.

---

## 15. Database: `synchronize: true`, no migrations

**Where:** `common/database/databse.module.ts:16-18`

```ts
database: 'entity-core',
autoLoadEntities: true,
synchronize: true,
```

`synchronize: true` lets TypeORM alter and drop columns to match entities on every boot. It will eventually delete data without warning. The database name is also hardcoded rather than read from config, unlike every other connection field.

### Fix

```ts
useFactory: (config: ConfigService) => ({
  type: 'postgres',
  host: config.get<string>('database.host'),
  port: config.get<number>('database.port'),
  username: config.get<string>('database.username'),
  password: config.get<string>('database.password'),
  database: config.get<string>('database.name'),
  autoLoadEntities: true,
  synchronize: false,
  migrationsRun: true,
  migrations: [__dirname + '/../../migrations/*.js'],
}),
```

Add a TypeORM datasource file and the usual scripts:

```json
"migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/data-source.ts",
"migration:run": "typeorm-ts-node-commonjs migration:run -d src/data-source.ts",
"migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/data-source.ts"
```

Do this before there's data you care about — the migration baseline is much cheaper to establish now.

---

## 16. Secrets stored and logged in plaintext

**Where:** `account.entity.ts:23-26`, `telegram-runtime.ts:54-56`

```ts
@Column({ type: 'jsonb' })
credentials: AccountCredentials;      // { api_id, api_hash, session }
```

A Telegram `session` string is **full account access** — no password, no 2FA prompt. Anyone with read access to the `account` table, a database backup, or a log dump owns every persona's Telegram account.

And the connect path logs part of a secret:

```ts
this.logger.log(
  `Successfully connected to Telegram Platform. Api hash: ${credentials.api_hash.slice(0, 5)}`,
);
```

*(`.env` is correctly listed in `.gitignore` and is untracked — that part is fine.)*

### Fix

- Encrypt `credentials` at rest with a key from the environment (AWS KMS, or `node:crypto` AES-256-GCM for a self-managed setup). A TypeORM `ValueTransformer` makes this transparent to the rest of the code:

```ts
@Column({ type: 'text', transformer: new EncryptedJsonTransformer<AccountCredentials>() })
credentials: AccountCredentials;
```

- Never log any part of `api_hash` or `session`. Log the account id instead:

```ts
this.logger.log(`Connected to Telegram for account ${account.id}`);
```

- Add a `toJSON()` on `AccountEntity` that redacts `credentials`, so an accidental `JSON.stringify(context)` in a future log line can't leak them.
- Consider whether `RuntimeContext` needs to carry `account` at all once `init()` has consumed the credentials (see #14).

---

## 17. No config validation

**Where:** `config/configuration.ts`

Every value is read straight from `process.env` with no validation:

```ts
port: process.env.DATABASE_PORT || 5432,   // string | 5432
```

`DATABASE_PORT` arrives as a **string**, but is consumed as `configService.get<number>('database.port')` — the generic is an unchecked assertion, not a conversion. A missing `DATABASE_HOST` or `GEMINI_API_KEY` surfaces as an obscure connection error at runtime rather than a clear failure at boot.

`zod` is already a dependency.

### Fix

```ts
// config/configuration.ts
const envSchema = z.object({
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_USERNAME: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_NAME: z.string().default('entity-core'),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().default('gemini-flash-latest'),
});

export const configuration = () => {
  const env = envSchema.parse(process.env);   // fails fast, with a readable message
  return {
    database: {
      host: env.DATABASE_HOST,
      port: env.DATABASE_PORT,
      username: env.DATABASE_USERNAME,
      password: env.DATABASE_PASSWORD,
      name: env.DATABASE_NAME,
    },
    ai: { gemini: { apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL } },
  };
};
```

Two related notes:

- The `telegram.apiId` / `telegram.apiHash` config block is never read anywhere — credentials come from the `account` table instead. Delete it, or wire it up as the default for new accounts.
- `gemini.service.ts:23` hardcodes `model: 'gemini-flash-latest'`. Move it to config so you can change models without a redeploy.
- Add `.env.example` documenting every required variable.

---

## 18. `strict` mode is off

**Where:** `tsconfig.json`

```json
"strictNullChecks": true,
"noImplicitAny": false,
"strictBindCallApply": false,
```

`strict` is not enabled, so `strictPropertyInitialization`, `strictFunctionTypes`, and `noImplicitAny` are all off. For a codebase this abstraction-heavy, strict mode is precisely what makes the abstractions pay for themselves — it's what would have caught #9 (`capabilities` never initialized), #12b (payload type mismatch), and flagged the `any` returns on `resolve()`.

### Fix

Turn it on and fix the fallout — expect it to be mostly the issues already listed here.

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true
}
```

If the fallout is too large to absorb at once, enable `strict` with `"strictPropertyInitialization": false` first, then remove that escape hatch after #9 and #12 land.

Also worth doing: `Action.resolve()` returns `Promise<any>` in every implementation. Change the base to `Promise<void>` — nothing consumes a return value.

---

## 19. Zero tests

Jest is fully configured in `package.json` and there is not a single `.spec.ts` file.

The highest-value targets are pure logic with no I/O:

- **`PlaneResolverService.resolve`** — action lookup, ordering, error propagation on unknown types (#8), abort-vs-continue semantics.
- **Capability matching** — `PlatformRuntime.get()` / `has()`, including the `implements`-vs-`extends` bug in #12e, which a test would have caught immediately.
- **`actionsFor(runtime)`** (once #2 lands) — a runtime with a capability offers the action; one without doesn't.
- **Plan schema validation** (once #8 lands) — valid plans parse, malformed and hallucinated plans are rejected.
- **`ConversationRef`** — key generation and equality.

Then one integration test with a fake `PlatformRuntime` (an `RxJS` `Subject` for `$events`, in-memory capabilities) driving the full event → plan → resolve loop with a stubbed planner. That test would cover the ordering guarantee from #7, which is otherwise very hard to verify by hand.

---

## 20. Dead code, naming, and consistency

**Dead code**

| Item | Location |
|---|---|
| `AccountService` is an empty class with two unused imports | `entities/account/account.service.ts` |
| `AccountModule` is imported by `AppModule` but provides nothing used | `app.module.ts:13` |
| `scripts/tg_connect.ts` — hardcoded empty `apiId`/`apiHash`, exported but never called | `scripts/tg_connect.ts:5-6` |
| Unused `TelegramClient` / `EntityLike` imports (see #5a) | `common/capability/capabilities/message-capability.ts:3-5` |
| Unused `ExecutionContext` import from `@nestjs/common` | `message-send.action.ts:7` |
| Unused `delay` import | `plan-resolver.service.ts:5` |
| Unused `RuntimeContext` / `systemActions` imports | `planner.module.ts:5-6` |
| Unused `Api` import | `telegram-runtime.ts:7` |
| Unused `app` variable | `main.ts:5` |
| `console.log('plan', plan)` — every other service uses `Logger` | `plan-resolver.service.ts:18` |

The unused imports would all be caught automatically by adding `@typescript-eslint/no-unused-vars` to `eslint.config.mjs` and running `yarn lint` in CI.

**Typos**

- `common/database/databse.module.ts` → `database.module.ts`
- `PlaneResolverService` → `PlanResolverService` (and `plan-resolver.service.ts` already spells the file correctly)
- `typing-capability.ts:7` — the description text says "MessageCapability is the interface responsible for all typing interactions", copy-pasted from the message capability. This string goes into an LLM prompt, so it's not cosmetic.

**File naming** — Nest convention is kebab-case throughout; these break it:

- `platformRuntime.ts` → `platform-runtime.ts`
- `ConversationRef.ts` → `conversation-ref.ts`
- `IncomingMessagePipeline.ts` → `incoming-message.pipeline.ts`
- `PlatformEvent.ts` → `platform-event.ts`
- `IncomingMessagePlatformEvent.ts` → `incoming-message.platform-event.ts`
- `Gemini.module.ts` → `gemini.module.ts`

Note `forceConsistentCasingInFileNames` is already on, so renames must go through `git mv` to be picked up on case-insensitive filesystems (macOS).

**Export style** — default and named exports are mixed arbitrarily. `RuntimeContext`, `GeminiService`, `IncomingMessagePipeline`, and `PlannerModule` are default exports; everything else is named. Standardize on named exports — they're refactor-safe and match the rest of the codebase.

**`.d.ts` misuse** — `entities/account/types.d.ts` and `core/planner/planner.d.ts` contain hand-authored types that are part of the source, not ambient declarations. `planner.d.ts` in particular has no import/export and therefore pollutes the global scope (#12a). Both should be plain `.ts` modules.

---

## Suggested sequencing

Ordered by risk reduced per unit of work. Each step is independently shippable.

**Phase 1 — stop the bleeding**
1. #6 Error boundaries on both floating-promise sites.
2. #7 Per-conversation execution queue.
3. #8 Validate LLM output; fail loudly on unknown action types.

These three are live bugs. #7 is the one users would notice.

**Phase 2 — make the abstractions load-bearing**
4. #2 + #1 + #3 Collapse actions onto capabilities via one registry; remove the silent no-op.
5. #4 `ConversationRef` as a serializable value object.
6. #5 Remove the three Telegram leaks from core.
7. #8 (second half) Zod as the single schema source; drop `@google/genai` types out of `core/`.

After this, adding a platform or an action is additive rather than a six-file edit.

**Phase 3 — durability**
8. #15 Migrations, `synchronize: false`.
9. #14 `Conversation` / `Message` entities, persona traits, history in the prompt.
10. #16 Encrypt credentials; stop logging secrets.
11. #10 Lifecycle: `disconnect()`, shutdown hooks, reconnect policy.

**Phase 4 — tighten**
12. #17 Config validation.
13. #18 `strict: true`, fix the fallout.
14. #19 Tests on the resolver, capability matching, and plan validation.
15. #11, #12, #13, #20 Dispatch map, type cleanups, renames, dead code.

Phase 1 is worth doing before any new features. Phase 2 is worth doing before adding the second platform — retrofitting it afterwards means changing two implementations instead of one.
