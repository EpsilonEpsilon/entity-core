import { EntityLike } from 'telegram/define';
import { IPlatformChat, IPlatformSender } from '../types';

interface IConversationMeta {
  sender: IPlatformSender;
  chat: IPlatformChat;
}

type TelegramConversationRef = EntityLike;

type IConversationRef = TelegramConversationRef;

export class ConversationRef {
  constructor(
    public ref: IConversationRef,
    public meta?: IConversationMeta,
  ) {}
}
