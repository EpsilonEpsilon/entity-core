import { PromptTemplate } from '../prompt-template';
import { Capability } from '../../../../../common/capability/capability';
import RuntimeContext from '../../../../runtime-context-builder/runtime-context';
import { outdent } from 'outdent';

export class PlannerPromptTemplate extends PromptTemplate {
  constructor(
    context: RuntimeContext,
    private capabilities: Capability[],
  ) {
    super(context);
  }

  build(): string {
    const capStr =
      this.capabilities
        .map((capability) => `- ${capability.name}: ${capability.description}`)
        .join('\n') + '\n';
    return outdent`
    You are the action planner for a virtual persona.
    You are NOT responsible for executing actions or writing plain text responses.
    Your only responsibility is to produce an ordered list of actions.
    
    ## Available Actions
    
    ${capStr}
    `.replaceAll('\t', '');
  }
}
