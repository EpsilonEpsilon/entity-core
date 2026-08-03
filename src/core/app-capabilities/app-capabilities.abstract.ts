import { Capability } from '../../common/capability/capability';

export abstract class AppCapability<S = unknown> extends Capability<
  unknown,
  S
> {}
