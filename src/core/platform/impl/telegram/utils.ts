import { Api } from 'telegram';
import { ChatType } from '../../../../entities/chat/chat.entity';
import { Entity, EntityLike } from 'telegram/define';

export function mapTelegramChat(chat: EntityLike) {
  if (chat instanceof Api.User) {
    return {
      platformChatId: chat.id.toString(),
      type: ChatType.Private,
      title: undefined,
      meta: {
        accessHash: chat.accessHash?.toString(),
      },
    };
  }

  if (chat instanceof Api.Chat) {
    return {
      platformChatId: chat.id.toString(),
      type: ChatType.Group,
      title: chat.title,
      meta: {},
    };
  }

  if (chat instanceof Api.Channel) {
    return {
      platformChatId: chat.id.toString(),
      type: chat.broadcast ? ChatType.Channel : ChatType.Group,
      title: chat.title,
      meta: {
        accessHash: chat.accessHash?.toString(),
      },
    };
  }
  if (chat instanceof Api.InputPeerUser) {
    return {
      platformChatId: chat.userId.toString(),
      type: ChatType.Private,
      meta: {
        accessHash: chat.accessHash.toString(),
      },
    };
  }

  if (chat instanceof Api.InputPeerChat) {
    return {
      platformChatId: chat.chatId.toString(),
      type: ChatType.Group,
      meta: {},
    };
  }

  if (chat instanceof Api.InputPeerChannel) {
    return {
      platformChatId: chat.channelId.toString(),
      type: ChatType.Channel,
      meta: {
        accessHash: chat.accessHash.toString(),
      },
    };
  }

  throw new Error('Unsupported Telegram chat');
}
