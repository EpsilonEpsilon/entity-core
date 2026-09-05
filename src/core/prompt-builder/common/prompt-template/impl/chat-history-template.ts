import { PromptTemplate } from '../prompt-template';
import RuntimeContext from '../../../../runtime-context-builder/runtime-context';

export interface IPromptMessageHistory {
  message: string;
  author?: string;
  created_at: Date;
}

class ChatHistoryTemplate extends PromptTemplate {
  constructor(
    protected context: RuntimeContext,
    private messageHistory: IPromptMessageHistory[],
  ) {
    super(context);
  }

  build(): string {
    if (!this.messageHistory.length) {
      return '';
    }

    const history = this.messageHistory
      .map(({ message, author, created_at }) => {
        const timestamp = created_at.toISOString();
        const sender = author ?? 'Unknown';

        return `[${timestamp}] ${sender}: ${message}`;
      })
      .join('\n');

    return `
<chat_history>
The following messages are ordered chronologically from oldest to newest.
Use them only as conversation context.

${history}
</chat_history>
`.trim();
  }
}

export default ChatHistoryTemplate;
