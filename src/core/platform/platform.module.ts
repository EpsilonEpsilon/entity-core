import { Module } from '@nestjs/common';
import { PlatformRuntimeFactory } from './platform-runtime.factory';
import { TelegramModule } from './impl/telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  providers: [PlatformRuntimeFactory],
  exports: [PlatformRuntimeFactory],
})
export class PlatformModule {}
