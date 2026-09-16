import { Injectable } from '@nestjs/common';
import { PersonaEntity } from '../../entities/persona/persona.entity';
import { PlatformRuntimeFactory } from '../platform/platform-runtime.factory';
import RuntimeContext from './runtime-context';
import { PersonaContext } from '../../entities/persona/persona.context';
import { ParticipantService } from '../../entities/participant/participant.service';
import ShortTermMemory from '../memory/short-term-memory/short-term-memory';
import { ModuleRef } from '@nestjs/core';
import { ChatService } from '../../entities/chat/chat.service';

@Injectable()
export class RuntimeContextBuilderService {
  constructor(
    private platformFactory: PlatformRuntimeFactory,
    private participantService: ParticipantService,
    private chatService: ChatService,
    private moduleRef: ModuleRef,
  ) {}
  public async build({ persona }: { persona: PersonaEntity }) {
    const { accounts } = persona;
    const personaContext = new PersonaContext(persona);
    const contextPromise = accounts.map(async (account) => {
      const platform = await this.platformFactory.get(account.platform);
      await platform.init(account.credentials);
      if (!platform.sender?.platformId)
        throw new Error('Unable to init participant');
      const participant = await this.initOwnParticipants(platform.sender);
      const shortTermMemory = await this.moduleRef.resolve(
        ShortTermMemory,
        undefined,
        { strict: false },
      );
      const chats = await this.chatService.findParticipantChats(participant.id);

      shortTermMemory.init(chats);

      if (!participant) throw new Error('Unable to find participant');

      return new RuntimeContext(
        account,
        personaContext,
        platform,
        participant,
        shortTermMemory,
      );
    });

    return await Promise.all(contextPromise);
  }

  private async initOwnParticipants(
    sender: RuntimeContext['platform']['sender'],
  ) {
    if (!sender) throw new Error('Planform native sender not initialized');

    return this.participantService.createOrUpdateParticipant({
      platform: sender.platform,
      platformUserId: sender?.platformId,
      firstName: sender?.firstName,
      lastName: sender?.lastName,
      username: sender?.username,
      meta: { accessHash: sender?.accessHash },
    });
  }
}
