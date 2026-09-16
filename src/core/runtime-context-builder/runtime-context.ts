import { AccountEntity } from '../../entities/account/account.entity';
import { PlatformRuntime } from '../platform/platformRuntime';
import { PersonaContext } from '../../entities/persona/persona.context';

import { ParticipantEntity } from '../../entities/participant/participant.entity';
import { ChatEntity } from '../../entities/chat/chat.entity';
import ShortTermMemory from '../memory/short-term-memory/short-term-memory';

class RuntimeContext {
  constructor(
    public readonly account: Readonly<AccountEntity>,
    public readonly personaContext: Readonly<PersonaContext>,
    public readonly platform: Readonly<PlatformRuntime>,
    public readonly participant: Readonly<ParticipantEntity>,
    public readonly shortTermMemory: ShortTermMemory,
  ) {}
}

export default RuntimeContext;
