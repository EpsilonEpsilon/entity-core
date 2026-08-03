import {
  PlatformRuntime,
  PlatformRuntimeConnectionState,
} from '../../platformRuntime';
import { Injectable, Logger } from '@nestjs/common';
import { TelegramCredentials } from '../../../../entities/account/types';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { TelegramMessageCapability } from './capabilities/telegram-message-capability';
import { IncomingMessagePlatformEvent } from '../../events/IncomingMessagePlatformEvent';
import { PlatformType } from '../../platform.enum';
import { ConversationRef } from '../../common/ConversationRef';
import { Subject } from 'rxjs';
import { PlatformEvent } from '../../events/PlatformEvent';

import { TelegramTypingCapability } from './capabilities/telegram-typing-capability';
import TelegramReadMessagesCapability from './capabilities/telegram-read-messages-capability';

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
      this.logger.log(
        `Successfully connected to Telegram Platform. Api hash: ${credentials.api_hash.slice(0, 5)}`,
      );
    } catch (error) {
      this.connectionState = PlatformRuntimeConnectionState.Disconnected;
      this.logger.error(error);
      throw error;
    }
  }

  private registerListeners() {
    this.client.addEventHandler(
      this.handleIncomingMessageEvent.bind(this),
      new NewMessage({ incoming: true }),
    );
  }

  private async handleIncomingMessageEvent(event: NewMessageEvent) {
    const platformEvent = new IncomingMessagePlatformEvent(
      PlatformType.telegram,
      event.message.id,
      new ConversationRef(await event.message.getInputChat()),
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
