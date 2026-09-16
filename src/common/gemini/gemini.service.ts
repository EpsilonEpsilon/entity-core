import { Inject, Injectable } from '@nestjs/common';
import {
  ContentListUnion,
  GenerateContentConfig,
  GenerateContentResponse,
  GoogleGenAI,
} from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { GEMINI_OPTIONS, type GeminiModuleOptions } from './Gemini.module';

@Injectable()
class GeminiService {
  private readonly client: GoogleGenAI;
  constructor(
    private config: ConfigService,
    @Inject(GEMINI_OPTIONS)
    private geminiOptions: GeminiModuleOptions,
  ) {
    this.client = new GoogleGenAI({
      apiKey: this.config.get('ai.gemini'),
    });
  }

  async generate(
    prompt: ContentListUnion,
    config?: GenerateContentConfig,
  ): Promise<GenerateContentResponse> {
    return await this.client.models.generateContent({
      model: this.geminiOptions.model || 'gemini-3.5-flash',
      contents: prompt,
      config,
    });
  }
}

export default GeminiService;
