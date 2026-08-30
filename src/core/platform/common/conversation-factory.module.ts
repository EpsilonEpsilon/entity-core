import { Module } from '@nestjs/common';
import ConversationFactoryService from './conversation-factory-service.service';
import ChatModule from '../../../entities/chat/chat.module';
import { ParticipantModule } from '../../../entities/participant/participant.module';

@Module({
  imports: [ChatModule, ParticipantModule],
  providers: [ConversationFactoryService],
  exports: [ConversationFactoryService],
})
class ConversationFactoryModule {}
export default ConversationFactoryModule;
