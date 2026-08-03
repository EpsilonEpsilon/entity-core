import { Module } from '@nestjs/common';
import IncomingMessagePipeline from './IncomingMessagePipeline';
import PlannerModule from '../../planner/planner.module';

@Module({
  imports: [PlannerModule],
  providers: [IncomingMessagePipeline],
  exports: [IncomingMessagePipeline],
})
export class PipelinesModule {}
