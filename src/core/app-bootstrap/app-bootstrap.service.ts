import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PersonaService } from '../../entities/persona/persona.service';
import { RuntimeContextBuilderService } from '../runtime-context-builder/runtime-context-builder.service';
import { RuntimeOrchestratorService } from '../runtime-orchestrator/runtime-orchestrator.service';
import RuntimeContext from '../runtime-context-builder/runtime-context';
import { ParticipantService } from '../../entities/participant/participant.service';

@Injectable()
export class AppBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppBootstrapService.name);
  constructor(
    private personaService: PersonaService,
    private runtimeContextBuilder: RuntimeContextBuilderService,
    private runtimeOrchestratorService: RuntimeOrchestratorService,
    private participantService: ParticipantService,
  ) {}
  async onApplicationBootstrap() {
    const contexts = (await this.createContext()).flat();

    contexts.map(async (ctx) => {
      this.logger.log(
        `RuntimeOrchestratorService is running ${ctx.personaContext.getEntity().name}`,
      );
      await ctx.platform.init(ctx.account.credentials);
      await this.initOwnParticipants(ctx);
      await this.runtimeOrchestratorService.run(ctx);
    });
  }

  private async createContext() {
    const personas = await this.personaService.getListOfPersonas();
    return await Promise.all(
      personas.map((persona) => this.runtimeContextBuilder.build({ persona })),
    );
  }

  private async initOwnParticipants(context: RuntimeContext) {
    if (!context.platform.sender)
      throw new Error('Planform native sender not initialized');
    const { sender } = context.platform;

    return this.participantService.createOrUpdateParticipant({
      platform: sender.platform,
      platformUserId: sender?.platformId,
      firstName: sender?.firstName,
      lastName: sender?.lastName,
      username: sender?.username,
      meta: { accessHash: sender?.accessHash },
    });
  }
}
