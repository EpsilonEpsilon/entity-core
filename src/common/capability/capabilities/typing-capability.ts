import { Capability } from '../capability';
import { CapabilityEnum } from '../capabilities.enum';
import { z } from 'zod';

const typingCapabilitySchema = z.object({
  name: z.enum([CapabilityEnum.typing]),
  duration: z.number(),
});

export type TypingCapabilitySchemaType = z.infer<typeof typingCapabilitySchema>;
export abstract class TypingCapability<T> extends Capability<
  T,
  typeof typingCapabilitySchema
> {
  name = CapabilityEnum.typing;
  description = `
    MessageCapability is the interface responsible for all typing interactions within 
    the current conversation. When available, you can use it to show typing status in the chat.
    Typing duration is ms.
  `;
  schema = typingCapabilitySchema;
  abstract execute(args: T, input: TypingCapabilitySchemaType): Promise<void>;
}
