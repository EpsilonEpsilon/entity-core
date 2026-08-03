import RuntimeContext from '../../../runtime-context-builder/runtime-context';

export abstract class PromptTemplate {
  constructor(protected context: RuntimeContext) {}

  public abstract build(): string;
}
