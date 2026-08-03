import { Module } from '@nestjs/common';
import { RuntimeContextBuilderService } from './runtime-context-builder.service';
import { PlatformModule } from '../platform/platform.module';

@Module({
  imports: [PlatformModule],
  providers: [RuntimeContextBuilderService],
  exports: [RuntimeContextBuilderService],
})
export class RuntimeContextBuilderModule {}
