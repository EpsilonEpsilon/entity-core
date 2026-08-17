import { PlatformEvent } from '../PlatformEvent';
import { PlatformType } from '../../platform.enum';
import { ConversationRef } from '../../common/ConversationRef';
import { NewPlatformMessage } from './NewPlatformMessage';

export class OutgoingMessagePlatformEvent extends NewPlatformMessage {}
