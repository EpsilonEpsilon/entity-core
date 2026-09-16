import { Module } from '@nestjs/common';
import { RuntimeContextBuilderService } from './runtime-context-builder.service';
import { PlatformModule } from '../platform/platform.module';
import { ParticipantModule } from '../../entities/participant/participant.module';
import ChatModule from '../../entities/chat/chat.module';
import MemoryModule from '../memory/memory.module';

@Module({
  imports: [PlatformModule, ParticipantModule, ChatModule, MemoryModule],
  providers: [RuntimeContextBuilderService],
  exports: [RuntimeContextBuilderService],
})
export class RuntimeContextBuilderModule {}
