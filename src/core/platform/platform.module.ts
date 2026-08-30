import { Module } from '@nestjs/common';
import { PlatformRuntimeFactory } from './platform-runtime.factory';
import { TelegramModule } from './impl/telegram/telegram.module';
import ConversationFactoryModule from './common/conversation-factory.module';

@Module({
  imports: [TelegramModule, ConversationFactoryModule],
  providers: [PlatformRuntimeFactory],
  exports: [PlatformRuntimeFactory],
})
export class PlatformModule {}
