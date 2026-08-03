import { Capability } from '../capability';
import { CapabilityEnum } from '../capabilities.enum';
import { z } from 'zod';

export const messageCapabilityInputSchema = z.object({
  name: z.enum([CapabilityEnum.message]),
  message: z.string(),
});
export type MessageCapabilityInputSchemaType = z.infer<
  typeof messageCapabilityInputSchema
>;
export abstract class MessageCapability<T> implements Capability<
  T,
  typeof messageCapabilityInputSchema
> {
  schema = messageCapabilityInputSchema;
  name = CapabilityEnum.message;
  description = `
    MessageCapability is the interface responsible for sending messages
  `;
  abstract execute(
    args: T,
    input: MessageCapabilityInputSchemaType,
  ): Promise<void>;
}
