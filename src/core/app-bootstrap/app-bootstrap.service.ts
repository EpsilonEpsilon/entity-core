import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PersonaService } from '../../entities/persona/persona.service';
import { RuntimeContextBuilderService } from '../runtime-context-builder/runtime-context-builder.service';
import { RuntimeOrchestratorService } from '../runtime-orchestrator/runtime-orchestrator.service';

@Injectable()
export class AppBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppBootstrapService.name);
  constructor(
    private personaService: PersonaService,
    private runtimeContextBuilder: RuntimeContextBuilderService,
    private runtimeOrchestratorService: RuntimeOrchestratorService,
  ) {}
  async onApplicationBootstrap() {
    const contexts = (await this.createContext()).flat();

    contexts.map(async (ctx) => {
      this.logger.log(
        `RuntimeOrchestratorService is running ${ctx.personaContext.getEntity().name}`,
      );
      await this.runtimeOrchestratorService.run(ctx);
    });
  }

  private async createContext() {
    const personas = await this.personaService.getListOfPersonas();
    return await Promise.all(
      personas.map((persona) => this.runtimeContextBuilder.build({ persona })),
    );
  }
}
