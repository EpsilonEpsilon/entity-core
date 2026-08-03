import {
  MessageCapability,
  MessageCapabilityInputSchemaType,
} from '../../../../../common/capability/capabilities/message-capability';
import { TelegramClient } from 'telegram';
import { EntityLike } from 'telegram/define';
import { ConversationRef } from '../../../common/ConversationRef';

interface Args {
  conversation: ConversationRef;
}
export class TelegramMessageCapability extends MessageCapability<Args> {
  constructor(private client: TelegramClient) {
    super();
  }

  async execute(
    args: Args,
    input: MessageCapabilityInputSchemaType,
  ): Promise<void> {
    await this.client.sendMessage(args.conversation.id as EntityLike, {
      message: input.message,
    });
  }
}
