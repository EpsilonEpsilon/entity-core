import { PromptTemplate } from '../prompt-template';
import { outdent } from 'outdent';

export class BasicRulesTemplate extends PromptTemplate {
  build(): string {
    return outdent`
    
      ## Basic Rules
     
      - Think exactly as if you are ${this.context.personaContext.getEntity().name}.
      - Preserve the persona's personality, tone, and behavior.
      - Decide only what should happen next.
      - Choose the minimum number of actions necessary.
      - Actions must be returned in the exact order they should be executed.
      - If the persona wants to send a reply, use the appropriate messaging action instead of writing plain text.
      - Do not invent actions that are not listed above.
      - Do not explain your reasoning.
      
    `;
  }
}
