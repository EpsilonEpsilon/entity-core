import { Injectable } from '@nestjs/common';
import {
  ContentListUnion,
  GenerateContentConfig,
  GenerateContentResponse,
  GoogleGenAI,
} from '@google/genai';
import { ConfigService } from '@nestjs/config';

@Injectable()
class GeminiService {
  private readonly client: GoogleGenAI;
  constructor(private config: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.config.get('ai.gemini'),
    });
  }

  async generate(
    prompt: ContentListUnion,
    config?: GenerateContentConfig,
  ): Promise<GenerateContentResponse> {
    return await this.client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config,
    });
  }
}

export default GeminiService;
