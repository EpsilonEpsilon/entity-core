import { z } from 'zod';
import { CapabilityEnum } from '../capabilities.enum';
import { Capability } from '../capability';

export const readMessageCapabilitySchema = z.object({
  name: z.enum([CapabilityEnum.readAllMessages]),
});

export type ReadMessageCapabilityType = z.infer<
  typeof readMessageCapabilitySchema
>;

export abstract class ReadMessageCapability<T> implements Capability<
  T,
  typeof readMessageCapabilitySchema
> {
  name = CapabilityEnum.readAllMessages;
  schema = readMessageCapabilitySchema;
  description = `
    ReadMessageCapability is the interface responsible for reading all messages in the chat.
    If this capability available you should always exec it before doing other actions in the chat room
  `;
  abstract execute(
    args: unknown,
    input: ReadMessageCapabilityType,
  ): Promise<void>;
}
