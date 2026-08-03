import { Module } from '@nestjs/common';
import { IncomingMessageReactionPromptBuilderService } from './incoming-message-reaction-prompt-builder.service';

@Module({
  imports: [],
  providers: [IncomingMessageReactionPromptBuilderService],
  exports: [IncomingMessageReactionPromptBuilderService],
})
export class PromptBuilderModule {}
