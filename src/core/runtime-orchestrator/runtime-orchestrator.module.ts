import { Module } from '@nestjs/common';
import { RuntimeOrchestratorService } from './runtime-orchestrator.service';
import { PlatformEventHandlerModule } from '../platform-event-handler/platform-event-handler.module';

@Module({
  imports: [PlatformEventHandlerModule],
  providers: [RuntimeOrchestratorService],
  exports: [RuntimeOrchestratorService],
})
export class RuntimeOrchestratorModule {}
