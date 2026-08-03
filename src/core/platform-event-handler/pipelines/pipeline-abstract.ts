import RuntimeContext from '../../runtime-context-builder/runtime-context';
import { PlatformEvent } from '../../platform/events/PlatformEvent';

export interface PipelineAbstract<T extends PlatformEvent = PlatformEvent> {
  process: (context: RuntimeContext, event: PlatformEvent) => void;
}
