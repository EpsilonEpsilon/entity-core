import { Injectable } from '@nestjs/common';
import RuntimeContext from '../runtime-context-builder/runtime-context';
import { PlatformEvent } from '../platform/events/PlatformEvent';
import { PipelineAbstract } from './pipelines/pipeline-abstract';
import { MessageCapability } from '../../common/capability/capabilities/message-capability';
import { IncomingMessagePlatformEvent } from '../platform/events/IncomingMessagePlatformEvent';
import IncomingMessagePipeline from './pipelines/IncomingMessagePipeline';

@Injectable()
export class PlatformEventHandlerService implements PipelineAbstract {
  constructor(private incomingMessagePipeline: IncomingMessagePipeline) {}
  process(context: RuntimeContext, event: PlatformEvent) {
    if (event instanceof IncomingMessagePlatformEvent) {
      return this.incomingMessagePipeline.process(context, event);
    }
  }
}
