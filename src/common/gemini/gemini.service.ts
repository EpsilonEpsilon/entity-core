import { Injectable } from '@nestjs/common';
import {
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
    prompt: string,
    config?: GenerateContentConfig,
  ): Promise<GenerateContentResponse> {
    return await this.client.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config,
    });
  }
}

export default GeminiService;
