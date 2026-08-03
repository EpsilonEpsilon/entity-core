import { CapabilityEnum } from './capabilities.enum';
import { z } from 'zod';
export abstract class Capability<T = unknown, S = unknown> {
  name: CapabilityEnum;
  description: string;
  schema: S;
  abstract execute(args: T, input: z.infer<S>): Promise<void>;
}
