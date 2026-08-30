import { Injectable } from '@nestjs/common';
import {
  ConversationRef,
  IConversationMeta,
  IConversationRef,
} from './conversation-ref';
import { IPlatformChat, IPlatformSender } from '../types';
import { ParticipantService } from '../../../entities/participant/participant.service';
import { ChatService } from '../../../entities/chat/chat.service';

interface IFactoryMeta {
  sender: Omit<IPlatformSender, 'id'>;
  chat: Omit<IPlatformChat, 'id'>;
}
@Injectable()
class ConversationFactoryService {
  constructor(
    private readonly participantService: ParticipantService,
    private readonly chatService: ChatService,
  ) {}
  async createRef(ref: IConversationRef, meta?: IFactoryMeta) {
    const factoryMeta = structuredClone(meta);
    const platformChatId = factoryMeta?.chat.platformChatId;
    const platformId = factoryMeta?.sender.platformId;

    if (!platformId) throw new Error('Participant platformId is missing');
    if (!platformChatId)
      throw new Error('MessagePlatformEvent Conversation ref missing chat');

    if (!factoryMeta?.sender.platformId)
      throw new Error('MessagePlatform Event sender platformId is missing');
    const participant =
      await this.participantService.findParticipantByPlatformId(platformId);

    const chat =
      await this.chatService.findChatByPlatformChatId(platformChatId);
    if (!participant || !chat)
      throw new Error('Participant or Chat Entities are missing');
    const conversationMeta: IConversationMeta = {
      ...factoryMeta,
      chat: { ...factoryMeta.chat, id: chat.id },
      sender: { ...factoryMeta.sender, id: participant.id },
    };
    return new ConversationRef(ref, conversationMeta);
  }
}

export default ConversationFactoryService;
