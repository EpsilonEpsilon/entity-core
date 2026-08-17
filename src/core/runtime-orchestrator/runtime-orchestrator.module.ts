import { Module } from '@nestjs/common';
import { RuntimeOrchestratorService } from './runtime-orchestrator.service';
import { PlatformEventHandlerModule } from '../platform-event-handler/platform-event-handler.module';
import EventHandlerPreprocessorModule from '../event-handler-preprocessor/event-handler-preprocessor.module';

@Module({
  imports: [PlatformEventHandlerModule, EventHandlerPreprocessorModule],
  providers: [RuntimeOrchestratorService],
  exports: [RuntimeOrchestratorService],
})
export class RuntimeOrchestratorModule {}
