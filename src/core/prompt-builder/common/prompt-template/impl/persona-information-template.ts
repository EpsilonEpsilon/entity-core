import { PromptTemplate } from '../prompt-template';
import { outdent } from 'outdent';

export class PersonaInformationTemplate extends PromptTemplate {
  build(): string {
    return outdent`
    
      ## Persona
      
      Name: ${this.context.personaContext.getEntity().name}
      
    `;
  }
}
