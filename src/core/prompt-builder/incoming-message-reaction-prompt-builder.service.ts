import { Injectable } from '@nestjs/common';
import RuntimeContext from '../runtime-context-builder/runtime-context';
import { Prompt } from './common/prompt/Prompt';
import { PlannerPromptTemplate } from './common/prompt-template/impl/planner-prompt-template';
import { PersonaInformationTemplate } from './common/prompt-template/impl/persona-information-template';
import { Capability } from '../../common/capability/capability';
import { BasicRulesTemplate } from './common/prompt-template/impl/basic-rules-template';
import { outdent } from 'outdent';

@Injectable()
export class IncomingMessageReactionPromptBuilderService {
  constructor() {}

  public buildIncomingMessageTextReaction(context: RuntimeContext) {
    const prompt = new Prompt();
    prompt.use(new PersonaInformationTemplate(context));
    prompt.append(
      outdent`
     
      #Task
      
      Your task is to answer to the last user message in the history as ${context.personaContext.getEntity().name}.
      Use other messages as context
      `,
    );
    prompt.use(new BasicRulesTemplate(context));

    return prompt;
  }

  public buildIncomingMessagePlan(
    context: RuntimeContext,
    args: {
      incomingMessageReaction: string;
      capabilities: Capability[];
    },
  ) {
    const prompt = new Prompt();
    prompt.use(new PlannerPromptTemplate(context, args.capabilities));
    prompt.append(
      outdent`
            # Task

            Your task is to determine which actions the persona should perform in order to deliver the already-generated response.
            
            The response content has already been decided. Do not change its meaning.
            
            # Response
            
            <response>
            ${args.incomingMessageReaction}
            </response>
      `,
    );

    prompt.use(new BasicRulesTemplate(context));
    return prompt.toString();
  }
}
