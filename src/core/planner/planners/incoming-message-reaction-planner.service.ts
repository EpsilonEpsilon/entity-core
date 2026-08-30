import { PlannerInterface } from '../planner.abstract';
import RuntimeContext from '../../runtime-context-builder/runtime-context';
import GeminiService from '../../../common/gemini/gemini.service';
import { Injectable } from '@nestjs/common';
import { z, ZodType } from 'zod';
import AppCapabilitiesRegistryService from '../../app-capabilities/app-capabilities-registry.service';
import { IncomingMessageReactionPromptBuilderService } from '../../prompt-builder/incoming-message-reaction-prompt-builder.service';
import { IPlan } from '../planner';
import { Capability } from '../../../common/capability/capability';

interface ISendMessagePlannerContext {
  receivedMessage: string;
}
@Injectable()
export class IncomingMessageReactionPlannerService implements PlannerInterface<ISendMessagePlannerContext> {
  constructor(
    private gemini: GeminiService,
    private appCapabilitiesRegistry: AppCapabilitiesRegistryService,
    private promptBuilder: IncomingMessageReactionPromptBuilderService,
  ) {}
  async plan(
    context: RuntimeContext,
    plannerContext: ISendMessagePlannerContext,
  ): Promise<IPlan[]> {
    const capabilities = [
      ...context.platform.getAllCapabilities(),
      ...this.appCapabilitiesRegistry.getRegistry(),
    ] as Capability[];
    const capabilitySchemas = capabilities.map((capability) => {
      const schema = z.toJSONSchema(capability.schema as unknown as ZodType, {
        target: 'draft-07',
      }) as Record<string, unknown>;

      delete schema.$schema;

      return schema;
    });
    const recipeJsonSchema = {
      type: 'array',
      items: {
        anyOf: capabilitySchemas,
      },
    };

    const prompt = this.promptBuilder.build(context, {
      incomingMessage: plannerContext.receivedMessage,
      capabilities,
    });
    const response = await this.gemini.generate(prompt, {
      responseMimeType: 'application/json',
      responseSchema: recipeJsonSchema,
    });

    return JSON.parse(response.text || '');
  }
}
