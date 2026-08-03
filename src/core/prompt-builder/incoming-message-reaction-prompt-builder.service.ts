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
  public build(
    context: RuntimeContext,
    args: { incomingMessage: string; capabilities: Capability[] },
  ) {
    const prompt = new Prompt();
    prompt.use(new PlannerPromptTemplate(context, args.capabilities));
    prompt.use(new PersonaInformationTemplate(context));
    prompt.append(
      outdent`
      
      #Task
      
      Your task is to determine which actions the persona should perform after receiving the latest message.
      
      `,
    );
    prompt.append(outdent`
    
    ## Incoming Message
      
    "${args.incomingMessage}"
      
    `);
    prompt.use(new BasicRulesTemplate(context));
    return prompt.toString();
  }
}
