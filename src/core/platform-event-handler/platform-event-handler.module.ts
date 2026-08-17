import { Module } from '@nestjs/common';
import { PlatformEventHandlerService } from './platform-event-handler.service';
import { PipelinesModule } from './pipelines/pipelines.module';
import { NewMessagePipeline } from './pipelines/NewMessagePipeline';
import MessageHistoryModule from '../message-history/message-history.module';
import { ParticipantModule } from '../../entities/participant/participant.module';
import ChatModule from '../../entities/chat/chat.module';

@Module({
  imports: [
    PipelinesModule,
    MessageHistoryModule,
    ParticipantModule,
    ChatModule,
  ],
  providers: [PlatformEventHandlerService, NewMessagePipeline],
  exports: [PlatformEventHandlerService],
})
export class PlatformEventHandlerModule {}
