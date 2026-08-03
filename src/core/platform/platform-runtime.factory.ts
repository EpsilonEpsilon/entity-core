import { Injectable, Type } from '@nestjs/common';
import { PlatformType } from './platform.enum';
import { PlatformRuntime } from './platformRuntime';
import { TelegramRuntime } from './impl/telegram/telegram-runtime';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class PlatformRuntimeFactory {
  private readonly platformMap: Record<PlatformType, Type<PlatformRuntime>>;
  constructor(private moduleRef: ModuleRef) {
    this.platformMap = { [PlatformType.telegram]: TelegramRuntime };
  }

  public async get(platform: PlatformType): Promise<PlatformRuntime> {
    const impl = await this.moduleRef.create(this.platformMap[platform]);
    if (!impl) throw new Error('Unknown platform');
    return impl;
  }
}
