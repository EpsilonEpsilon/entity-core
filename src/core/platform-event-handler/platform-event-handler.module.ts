import { Module } from '@nestjs/common';
import { PlatformEventHandlerService } from './platform-event-handler.service';
import { PipelinesModule } from './pipelines/pipelines.module';
import { NewMessagePipeline } from './pipelines/new-message-pipeline';
import MessageHistoryModule from '../message-history/message-history.module';
import { ParticipantModule } from '../../entities/participant/participant.module';
import ChatModule from '../../entities/chat/chat.module';
import { MessagesModule } from '../../entities/messages/messages.module';

@Module({
  imports: [PipelinesModule, MessageHistoryModule, ParticipantModule],
  providers: [PlatformEventHandlerService],
  exports: [PlatformEventHandlerService],
})
export class PlatformEventHandlerModule {}
