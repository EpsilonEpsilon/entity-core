import { PlatformEvent } from '../platform-event';
import { PlatformType } from '../../platform.enum';
import { ConversationRef } from '../../common/conversation-ref';

export class NewPlatformMessage implements PlatformEvent {
  constructor(
    readonly platform: PlatformType,

    public message_id: string | number,
    public conversation: ConversationRef,
    public message: string,
    public senderId: string | number | undefined,
    readonly targetId?: string,
  ) {}
}
