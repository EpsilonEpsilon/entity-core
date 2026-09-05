import { Injectable } from '@nestjs/common';
import RuntimeContext from '../runtime-context-builder/runtime-context';
import { PlatformEventHandlerService } from '../platform-event-handler/platform-event-handler.service';
import { buffer, debounceTime, filter, groupBy, map, mergeMap } from 'rxjs';
import EventHandlerPreprocessorService from '../event-handler-preprocessor/event-handler-preprocessor.service';
import { EventBuffer } from '../platform/events/event-buffer';

@Injectable()
export class RuntimeOrchestratorService {
  constructor(
    private platformEventHandlerService: PlatformEventHandlerService,
    private platformEventHandlePreprocessorService: EventHandlerPreprocessorService,
  ) {}

  public async run(context: RuntimeContext) {
    context.platform.$events
      .pipe(
        groupBy((event) => event.targetId ?? Symbol()),
        mergeMap(($events) =>
          $events.pipe(
            // TODO: Replace debounce buffering with ExecutionRegistry.
            // Future behavior:
            // - start processing events immediately
            // - cancel active execution when a new event arrives
            // - merge events and restart execution
            // - prevent cancellation after commit point
            // - support delay / block / resume
            buffer($events.pipe(debounceTime(2000))),
            filter((events) => events.length > 0),
          ),
        ),
        map((events) =>
          events.length > 1
            ? new EventBuffer(events[0].targetId!, events)
            : events[0],
        ),
      )
      .subscribe(async (eventOrEventBuffer) => {
        await this.platformEventHandlePreprocessorService.process(
          context,
          eventOrEventBuffer,
        );
        this.platformEventHandlerService.process(context, eventOrEventBuffer);
      });
  }
}
