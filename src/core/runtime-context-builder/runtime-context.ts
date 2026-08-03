import { AccountEntity } from '../../entities/account/account.entity';
import { PlatformRuntime } from '../platform/platformRuntime';
import { PersonaContext } from '../../entities/persona/persona.context';

class RuntimeContext {
  constructor(
    public account: AccountEntity,
    public personaContext: PersonaContext,
    public platform: PlatformRuntime,
  ) {}
}

export default RuntimeContext;
