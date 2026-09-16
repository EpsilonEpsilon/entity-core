import { Injectable, Scope } from '@nestjs/common';
import { ChatEntity } from '../../../entities/chat/chat.entity';
import MessageHistoryService from '../../message-history/message-history.service';
import { GeminiModule } from '../../../common/gemini/Gemini.module';

@Injectable({ scope: Scope.TRANSIENT })
class ShortTermMemory {
  private chatEntities!: ChatEntity[];
  constructor(
    private messageHistoryService: MessageHistoryService,
    private geminiModule: GeminiModule,
  ) {}
  public async init(chatEntity: ChatEntity[]) {
    this.chatEntities = chatEntity;
    try {
    } catch (e) {
      console.log(e, e);
    }
  }
}

export default ShortTermMemory;
