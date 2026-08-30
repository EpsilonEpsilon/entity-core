import { CapabilityEnum } from './capabilities.enum';
import { z } from 'zod';
import { ZodSchema } from 'zod/v3';
export abstract class Capability<T = unknown, S = unknown> {
  name: CapabilityEnum;
  description: string;
  schema: S;
  abstract execute(args: T, input: z.infer<S>): Promise<void>;
}
