import { Module } from '@nestjs/common';
import EventHandlerPreprocessorService from './event-handler-preprocessor.service';
import { ParticipantModule } from '../../entities/participant/participant.module';
import ChatModule from '../../entities/chat/chat.module';

@Module({
  imports: [ParticipantModule, ChatModule],
  providers: [EventHandlerPreprocessorService],
  exports: [EventHandlerPreprocessorService],
})
class EventHandlerPreprocessorModule {}

export default EventHandlerPreprocessorModule;
