import { DynamicModule, Module } from '@nestjs/common';
import GeminiService from './gemini.service';

export interface GeminiModuleOptions {
  model: string;
}
export const GEMINI_OPTIONS = Symbol('GEMINI_OPTIONS');
@Module({
  providers: [GeminiService],
  exports: [GeminiService],
})
export class GeminiModule {
  static register(options: GeminiModuleOptions): DynamicModule {
    return {
      module: GeminiModule,
      providers: [{ provide: GEMINI_OPTIONS, useValue: options }],
      exports: [GeminiService],
    };
  }
}
