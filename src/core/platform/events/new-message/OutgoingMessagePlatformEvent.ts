import { PlatformEvent } from '../platform-event';
import { PlatformType } from '../../platform.enum';
import { ConversationRef } from '../../common/conversation-ref';
import { NewPlatformMessage } from './NewPlatformMessage';

export class OutgoingMessagePlatformEvent extends NewPlatformMessage {}
