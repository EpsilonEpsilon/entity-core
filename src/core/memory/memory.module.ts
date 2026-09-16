import { Module } from '@nestjs/common';
import LongTermMemoryService from './long-term-memory.service';
import CacheManagerModule from '../../common/cache-manager/cache-manager.module';
import MessageHistoryModule from '../message-history/message-history.module';
import ChatModule from '../../entities/chat/chat.module';
import ShortTermMemory from './short-term-memory/short-term-memory';
import { GeminiModule } from '../../common/gemini/Gemini.module';

@Module({
  imports: [
    CacheManagerModule,
    MessageHistoryModule,
    ChatModule,
    GeminiModule.register({ model: 'gemini-3.1-flash-lite' }),
  ],
  providers: [LongTermMemoryService, ShortTermMemory],
  exports: [LongTermMemoryService, ShortTermMemory],
})
class MemoryModule {}

export default MemoryModule;
