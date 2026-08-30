import { CapabilityEnum } from '../../common/capability/capabilities.enum';

export interface IPlan {
  name: CapabilityEnum;
  [key: string]: unknown;
}
