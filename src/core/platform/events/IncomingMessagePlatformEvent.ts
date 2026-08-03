import { PlatformEvent } from './PlatformEvent';
import { ConversationRef } from '../common/ConversationRef';
import { PlatformType } from '../platform.enum';

export class IncomingMessagePlatformEvent implements PlatformEvent {
  constructor(
    readonly platform: PlatformType,
    public message_id: string | number,
    public conversation: ConversationRef,
    public message: string,
    public senderId: string | number | undefined,
  ) {}
}
