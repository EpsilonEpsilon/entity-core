import RuntimeContext from '../../runtime-context-builder/runtime-context';
import { PlatformEvent } from '../../platform/events/platform-event';
import { EventBuffer } from '../../platform/events/event-buffer';

export interface PipelineAbstract<
  T extends PlatformEvent | EventBuffer<PlatformEvent> = PlatformEvent,
> {
  process: (
    context: RuntimeContext,
    event: PlatformEvent | EventBuffer,
  ) => void;
}
