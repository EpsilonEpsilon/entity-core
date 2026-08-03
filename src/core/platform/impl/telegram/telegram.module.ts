import { Module } from '@nestjs/common';
import { TelegramRuntime } from './telegram-runtime';

@Module({
  providers: [TelegramRuntime],
  exports: [TelegramRuntime],
})
export class TelegramModule {}
