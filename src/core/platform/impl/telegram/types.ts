import { PlatformType } from '../../platform.enum';
import { ChatType } from '../../../../entities/chat/chat.entity';

export interface TelegramSender {
  id: string;
  platformId: string;
  platform: PlatformType.telegram;
  accessHash?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface ITelegramChat {
  id: string;
  platformChatId: string;
  platform: PlatformType.telegram;
  accessHash?: string;
  type: ChatType;
  title?: string;
}
