import {
  TypingCapability,
  TypingCapabilitySchemaType,
} from '../../../../../common/capability/capabilities/typing-capability';
import { Api, TelegramClient } from 'telegram';
import { ConversationRef } from '../../../common/ConversationRef';
import { EntityLike } from 'telegram/define';
import { delay } from '../../../../../utils';

interface Params {
  conversation: ConversationRef;
}
export class TelegramTypingCapability extends TypingCapability<Params> {
  constructor(private client: TelegramClient) {
    super();
  }

  async execute(args: Params, input: TypingCapabilitySchemaType) {
    await this.client.invoke(
      new Api.messages.SetTyping({
        peer: args.conversation.id as EntityLike,
        action: new Api.SendMessageTypingAction(),
      }),
    );
    await delay(input.duration);
  }
}
