import {
  MessageCapability,
  MessageCapabilityInputSchemaType,
} from '../../../../../common/capability/capabilities/message-capability';
import { Api, TelegramClient } from 'telegram';
import { EntityLike } from 'telegram/define';
import { ConversationRef } from '../../../common/ConversationRef';
import { Subject } from 'rxjs';
import { PlatformEvent } from '../../../events/PlatformEvent';
import { PlatformType } from '../../../platform.enum';
import { OutgoingMessagePlatformEvent } from '../../../events/new-message/OutgoingMessagePlatformEvent';
import Message = Api.Message;

interface Args {
  conversation: ConversationRef;
}
export class TelegramMessageCapability extends MessageCapability<Args> {
  constructor(private client: TelegramClient) {
    super();
  }
  public messageSubject: Subject<Message> = new Subject<Message>();
  async execute(
    args: Args,
    input: MessageCapabilityInputSchemaType,
  ): Promise<void> {
    const message = await this.client.sendMessage(
      args.conversation.ref as EntityLike,
      {
        message: input.message,
      },
    );
    this.messageSubject.next(message);
  }
}
