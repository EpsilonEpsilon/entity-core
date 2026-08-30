import { Module } from '@nestjs/common';
import { TelegramRuntime } from './telegram-runtime';
import ConversationFactoryModule from '../../common/conversation-factory.module';

@Module({
  imports: [ConversationFactoryModule],
  providers: [TelegramRuntime],
  exports: [TelegramRuntime],
})
export class TelegramModule {}
