import { AppCapability } from '../app-capabilities.abstract';
import { z } from 'zod';
import { CapabilityEnum } from '../../../common/capability/capabilities.enum';
import { delay } from '../../../utils';
const schema = z.object({
  name: z.enum([CapabilityEnum.delay]),
  delay: z.number(),
});
export class AppDelayCapability extends AppCapability<typeof schema> {
  name = CapabilityEnum.delay;
  description = `
    Using to emulate user thinking, typing, delays. Accepting delay in ms
    `;

  schema = schema;
  async execute(args: unknown, input: z.infer<typeof schema>) {
    return delay(input.delay);
  }
}
