import { Injectable, Logger } from '@nestjs/common';
import RuntimeContext from '../runtime-context-builder/runtime-context';
import { PlatformEventHandlerService } from '../platform-event-handler/platform-event-handler.service';

@Injectable()
export class RuntimeOrchestratorService {
  constructor(
    private platformEventHandlerService: PlatformEventHandlerService,
  ) {}
  private readonly logger = new Logger(RuntimeOrchestratorService.name);
  public async run(context: RuntimeContext) {
    this.logger.log(
      `RuntimeOrchestratorService is running ${context.personaContext.getEntity().name}`,
    );
    await context.platform.init(context.account.credentials);
    context.platform.$events.subscribe((event) => {
      this.platformEventHandlerService.process(context, event);
    });
  }
}
