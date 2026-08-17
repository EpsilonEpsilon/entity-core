import {
  PlatformRuntime,
  PlatformRuntimeConnectionState,
} from '../../platformRuntime';
import { Injectable, Logger } from '@nestjs/common';
import { TelegramCredentials } from '../../../../entities/account/types';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { TelegramMessageCapability } from './capabilities/telegram-message-capability';
import { IncomingMessagePlatformEvent } from '../../events/new-message/IncomingMessagePlatformEvent';
import { PlatformType } from '../../platform.enum';
import { ConversationRef } from '../../common/ConversationRef';
import { Subject } from 'rxjs';
import { PlatformEvent } from '../../events/PlatformEvent';

import { TelegramTypingCapability } from './capabilities/telegram-typing-capability';
import TelegramReadMessagesCapability from './capabilities/telegram-read-messages-capability';
import { mapTelegramChat } from './utils';
import { OutgoingMessagePlatformEvent } from '../../events/new-message/OutgoingMessagePlatformEvent';
import Message = Api.Message;

@Injectable()
export class TelegramRuntime extends PlatformRuntime {
  public events = new Subject<PlatformEvent>();
  public $events = this.events.asObservable();
  private readonly logger = new Logger(TelegramRuntime.name);
  private client: TelegramClient;
  public connectionState = PlatformRuntimeConnectionState.Idle;

  public capabilities: [
    TelegramMessageCapability,
    TelegramTypingCapability,
    TelegramReadMessagesCapability,
  ];

  public async init(credentials: TelegramCredentials) {
    if (
      this.connectionState === PlatformRuntimeConnectionState.Connecting ||
      this.connectionState === PlatformRuntimeConnectionState.Connected
    )
      throw new Error(
        `Cannot connect: runtime is currently ${this.connectionState}.`,
      );
    try {
      this.connectionState = PlatformRuntimeConnectionState.Connecting;
      const client = new TelegramClient(
        new StringSession(credentials.session),
        credentials.api_id,
        credentials.api_hash,
        { connectionRetries: 5 },
      );
      this.client = client;
      this.registerListeners();
      await client.connect();
      this.connectionState = PlatformRuntimeConnectionState.Connected;

      this.initCapabilities(this.client);
      await this.initPlatformSender();
      this.registerCapabilitiesListeners();
      this.logger.log(
        `Successfully connected to Telegram Platform. Api hash: ${credentials.api_hash.slice(0, 5)}`,
      );
    } catch (error) {
      this.connectionState = PlatformRuntimeConnectionState.Disconnected;
      this.logger.error(error);
      throw error;
    }
  }

  private async initPlatformSender() {
    const me = await this.client.getMe();

    this.sender = {
      platformId: me.id.toString(),
      firstName: me.firstName,
      platform: PlatformType.telegram,
      accessHash: me.accessHash?.toString(),
      lastName: me.lastName,
      username: me.username,
    };
  }

  private registerListeners() {
    this.client.addEventHandler(
      this.handleIncomingMessageEvent.bind(this),
      new NewMessage({ incoming: true }),
    );
  }

  private registerCapabilitiesListeners() {
    this.capabilities
      .find((capability) => capability instanceof TelegramMessageCapability)
      ?.messageSubject.subscribe((message) =>
        this.handleOutgoingMessage(message),
      );
  }

  private async createConversationRefFromMessage(
    message: Message,
    platformSender?: Api.User,
  ) {
    const sender = platformSender || (await message.getSender());

    const chat = await message.getInputChat();
    if (!(sender instanceof Api.User)) throw new Error('Missing user entity');
    if (!chat) throw new Error('Missing chat information');
    const chatInformation = mapTelegramChat(chat);

    return new ConversationRef(chat, {
      sender: {
        username: sender.username,
        platform: PlatformType.telegram,
        accessHash: sender.accessHash?.toString(),
        firstName: sender.firstName,
        lastName: sender.lastName,
        platformId: sender.id.toString(),
      },
      chat: {
        type: chatInformation.type,
        title: chatInformation.title,
        platform: PlatformType.telegram,
        platformChatId: chatInformation.platformChatId,
        accessHash: chatInformation.meta.accessHash,
      },
    });
  }

  private async handleOutgoingMessage(message: Message) {
    const conversationRef = await this.createConversationRefFromMessage(
      message,
      await this.client.getMe(),
    );
    const platformEvent = new OutgoingMessagePlatformEvent(
      PlatformType.telegram,
      message.id,
      conversationRef,
      message.message,
      message.senderId?.toString(),
    );

    this.events.next(platformEvent);
  }

  private async handleIncomingMessageEvent(event: NewMessageEvent) {
    const conversationRef = await this.createConversationRefFromMessage(
      event.message,
    );
    const platformEvent = new IncomingMessagePlatformEvent(
      PlatformType.telegram,
      event.message.id,
      conversationRef,
      event.message.message,
      event.message.senderId?.toString(),
    );

    this.events.next(platformEvent);
  }

  private initCapabilities(client: TelegramClient) {
    this.capabilities = [
      new TelegramMessageCapability(client),
      new TelegramTypingCapability(client),
      new TelegramReadMessagesCapability(client),
    ];
  }
}
