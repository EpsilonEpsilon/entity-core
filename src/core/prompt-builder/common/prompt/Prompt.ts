import { PromptTemplate } from '../prompt-template/prompt-template';
import { Logger } from '@nestjs/common';
import { outdent } from 'outdent';
export class Prompt {
  private prompt: string[] = [];
  private logger = new Logger(Prompt.name);
  //todo: implement more complex logic for templates
  public use(template: PromptTemplate) {
    this.append(outdent`${template.build()}`);
  }

  public append(query: string) {
    this.prompt.push(outdent`${query}`);
  }

  toString() {
    const prompt = this.prompt.join('').replace('\t', '');
    this.logger.log(`Build prompt`);
    return prompt;
  }
}
