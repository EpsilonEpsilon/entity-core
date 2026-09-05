import { Module } from '@nestjs/common';
import IncomingMessageReaction from './reactions/incoming-message-reaction';
import { GeminiModule } from '../../common/gemini/Gemini.module';
import { PromptBuilderModule } from '../prompt-builder/prompt-builder.module';

@Module({
  imports: [GeminiModule, PromptBuilderModule],
  providers: [IncomingMessageReaction],
  exports: [IncomingMessageReaction],
})
class ReactionModule {}

export default ReactionModule;
