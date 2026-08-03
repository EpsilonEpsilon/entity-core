import { Injectable } from '@nestjs/common';
import { PersonaEntity } from '../../entities/persona/persona.entity';
import { PlatformRuntimeFactory } from '../platform/platform-runtime.factory';
import RuntimeContext from './runtime-context';
import { PersonaContext } from '../../entities/persona/persona.context';

@Injectable()
export class RuntimeContextBuilderService {
  constructor(private platformFactory: PlatformRuntimeFactory) {}
  public async build({ persona }: { persona: PersonaEntity }) {
    const { accounts } = persona;
    const personaContext = new PersonaContext(persona);
    const contextPromise = accounts.map(async (account) => {
      const platform = await this.platformFactory.get(account.platform);
      return new RuntimeContext(account, personaContext, platform);
    });

    return await Promise.all(contextPromise);
  }
}
