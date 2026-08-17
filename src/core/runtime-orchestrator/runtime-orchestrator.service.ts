import { Injectable, Logger } from '@nestjs/common';
import RuntimeContext from '../runtime-context-builder/runtime-context';
import { PlatformEventHandlerService } from '../platform-event-handler/platform-event-handler.service';
import { mergeMap } from 'rxjs';
import EventHandlerPreprocessorService from '../event-handler-preprocessor/event-handler-preprocessor.service';

@Injectable()
export class RuntimeOrchestratorService {
  constructor(
    private platformEventHandlerService: PlatformEventHandlerService,
    private platformEventHandlePreprocessorService: EventHandlerPreprocessorService,
  ) {}

  public async run(context: RuntimeContext) {
    context.platform.$events
      .pipe(
        mergeMap(async (event) => {
          await this.platformEventHandlePreprocessorService.process(
            context,
            event,
          );
          this.platformEventHandlerService.process(context, event);
        }),
      )
      .subscribe();
  }
}
