import { PlatformType } from '../platform.enum';

export interface PlatformEvent {
  platform: PlatformType;
  // Groups events related to the same target.
  targetId?: string;
}
