import { EntityLike } from 'telegram/define';
import { IPlatformChat, IPlatformSender } from '../types';

export interface IConversationMeta {
  sender: IPlatformSender;
  chat: IPlatformChat;
}

export type TelegramConversationRef = EntityLike;

export type IConversationRef = TelegramConversationRef;

export class ConversationRef {
  constructor(
    public ref: IConversationRef,
    public meta?: IConversationMeta,
  ) {}
}
