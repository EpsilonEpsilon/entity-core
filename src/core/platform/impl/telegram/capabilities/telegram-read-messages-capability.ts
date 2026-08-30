import {
  ReadMessageCapability,
  ReadMessageCapabilityType,
} from '../../../../../common/capability/capabilities/read-meassage-capability';
import { Api, TelegramClient } from 'telegram';
import { ConversationRef } from '../../../common/conversation-ref';
import { EntityLike } from 'telegram/define';

interface Args {
  conversation: ConversationRef;
}
class TelegramReadMessagesCapability extends ReadMessageCapability<Args> {
  constructor(private client: TelegramClient) {
    super();
  }

  async execute(args: Args, _input: ReadMessageCapabilityType): Promise<void> {
    await this.client.invoke(
      new Api.messages.ReadHistory({
        peer: args.conversation.ref as EntityLike,
        maxId: 0,
      }),
    );
  }
}

export default TelegramReadMessagesCapability;
