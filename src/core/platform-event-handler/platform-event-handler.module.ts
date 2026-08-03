import { Module } from '@nestjs/common';
import { PlatformEventHandlerService } from './platform-event-handler.service';
import { PipelinesModule } from './pipelines/pipelines.module';

@Module({
  imports: [PipelinesModule],
  providers: [PlatformEventHandlerService],
  exports: [PlatformEventHandlerService],
})
export class PlatformEventHandlerModule {}
