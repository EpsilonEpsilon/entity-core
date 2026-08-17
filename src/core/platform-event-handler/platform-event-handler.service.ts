import { Injectable } from '@nestjs/common';
import RuntimeContext from '../runtime-context-builder/runtime-context';
import { PlatformEvent } from '../platform/events/PlatformEvent';
import { PipelineAbstract } from './pipelines/pipeline-abstract';
import { MessageCapability } from '../../common/capability/capabilities/message-capability';
import { IncomingMessagePlatformEvent } from '../platform/events/new-message/IncomingMessagePlatformEvent';
import IncomingMessagePipeline from './pipelines/IncomingMessagePipeline';
import { NewPlatformMessage } from '../platform/events/new-message/NewPlatformMessage';
import { NewMessagePipeline } from './pipelines/NewMessagePipeline';

@Injectable()
export class PlatformEventHandlerService implements PipelineAbstract {
  constructor(
    private incomingMessagePipeline: IncomingMessagePipeline,
    private newMessagePipeline: NewMessagePipeline,
  ) {}
  process(context: RuntimeContext, event: PlatformEvent) {
    if (event instanceof NewPlatformMessage)
      void this.newMessagePipeline.process(context, event);

    if (event instanceof IncomingMessagePlatformEvent)
      void this.incomingMessagePipeline.process(context, event);
  }
}
