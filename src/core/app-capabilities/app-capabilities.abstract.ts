import { Capability } from '../../common/capability/capability';
import { ZodSchema } from 'zod/v3';

export abstract class AppCapability<S = ZodSchema> extends Capability<
  unknown,
  S
> {}
