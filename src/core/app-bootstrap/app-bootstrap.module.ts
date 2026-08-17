import { Module } from '@nestjs/common';
import { AppBootstrapService } from './app-bootstrap.service';
import { PersonaModule } from '../../entities/persona/persona.module';
import { RuntimeContextBuilderModule } from '../runtime-context-builder/runtime-context-builder.module';
import { RuntimeOrchestratorModule } from '../runtime-orchestrator/runtime-orchestrator.module';
import { ParticipantModule } from '../../entities/participant/participant.module';

@Module({
  imports: [
    PersonaModule,
    RuntimeContextBuilderModule,
    RuntimeOrchestratorModule,
    ParticipantModule,
  ],
  providers: [AppBootstrapService],
})
export class AppBootstrapModule {}
