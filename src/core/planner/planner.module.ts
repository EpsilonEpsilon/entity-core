import { Module } from '@nestjs/common';
import { IncomingMessageReactionPlannerService } from './planners/incoming-message-reaction-planner.service';
import { GeminiModule } from '../../ai/gemini/Gemini.module';
import { PlaneResolverService } from './plan-resolver.service';
import AppCapabilitiesModule from '../app-capabilities/app-capabilities.module';
import { PromptBuilderModule } from '../prompt-builder/prompt-builder.module';

@Module({
  imports: [GeminiModule, AppCapabilitiesModule, PromptBuilderModule],
  providers: [IncomingMessageReactionPlannerService, PlaneResolverService],
  exports: [IncomingMessageReactionPlannerService, PlaneResolverService],
})
class PlannerModule {}

export default PlannerModule;
