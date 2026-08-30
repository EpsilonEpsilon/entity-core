import { Module } from '@nestjs/common';
import IncomingMessagePipeline from './incoming-message-pipeline';
import PlannerModule from '../../planner/planner.module';
import { NewMessagePipeline } from './new-message-pipeline';
import MessageHistoryModule from '../../message-history/message-history.module';

@Module({
  imports: [PlannerModule, MessageHistoryModule],
  providers: [IncomingMessagePipeline, NewMessagePipeline],
  exports: [IncomingMessagePipeline, NewMessagePipeline],
})
export class PipelinesModule {}
