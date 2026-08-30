import { Injectable, Logger } from '@nestjs/common';
import RuntimeContext from '../runtime-context-builder/runtime-context';
import { PlatformEvent } from '../platform/events/platform-event';
import { PipelineAbstract } from './pipelines/pipeline-abstract';
import { IncomingMessagePlatformEvent } from '../platform/events/new-message/IncomingMessagePlatformEvent';
import IncomingMessagePipeline from './pipelines/incoming-message-pipeline';
import { EventBuffer } from '../platform/events/event-buffer';

@Injectable()
export class PlatformEventHandlerService implements PipelineAbstract {
  private logger = new Logger(PlatformEventHandlerService.name);
  constructor(private incomingMessagePipeline: IncomingMessagePipeline) {}
  process(context: RuntimeContext, input: PlatformEvent | EventBuffer) {
    if (input instanceof EventBuffer) {
      this.logger.log(`Start processing event buffer of ${input.size}`);
    }

    if (this.isIncomingMessageInput(input)) {
      void this.incomingMessagePipeline.process(context, input);
    }
  }

  isIncomingMessageEvent = (
    event: PlatformEvent,
  ): event is IncomingMessagePlatformEvent =>
    event instanceof IncomingMessagePlatformEvent;

  private isIncomingMessageInput(
    input: PlatformEvent | EventBuffer,
  ): input is
    IncomingMessagePlatformEvent | EventBuffer<IncomingMessagePlatformEvent> {
    return (
      input instanceof IncomingMessagePlatformEvent ||
      (input instanceof EventBuffer && input.every(this.isIncomingMessageEvent))
    );
  }
}
