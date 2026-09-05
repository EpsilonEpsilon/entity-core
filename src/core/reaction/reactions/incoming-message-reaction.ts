import { Injectable } from '@nestjs/common';
import { IPromptMessageHistory } from '../../prompt-builder/common/prompt-template/impl/chat-history-template';
import GeminiService from '../../../common/gemini/gemini.service';
import RuntimeContext from '../../runtime-context-builder/runtime-context';
import { IncomingMessageReactionPromptBuilderService } from '../../prompt-builder/incoming-message-reaction-prompt-builder.service';
import { ThinkingLevel } from '@google/genai';

interface Args {
  context: RuntimeContext;
  messageHistory: IPromptMessageHistory[];
}

@Injectable()
class IncomingMessageReaction {
  constructor(
    private gemini: GeminiService,
    private promptBuilder: IncomingMessageReactionPromptBuilderService,
  ) {}
  public async generateTextReaction(args: Args): Promise<string> {
    const prompt = this.promptBuilder.buildIncomingMessageTextReaction(
      args.context,
    );
    const answer = await this.gemini.generate(
      args.messageHistory.map((item) => ({
        role:
          item.author === args.context.personaContext.getEntity().name
            ? 'model'
            : 'user',
        parts: [
          {
            text: `<message timestamp="${item.created_at.toString()}">
                       ${item.message}
                   </message>`,
          },
        ],
      })),
      {
        systemInstruction: prompt.toString(),
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    );
    return answer.text || '';
  }
}

export default IncomingMessageReaction;
