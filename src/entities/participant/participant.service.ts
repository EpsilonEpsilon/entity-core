import { Injectable } from '@nestjs/common';
import { ParticipantEntity } from './participant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ParticipantService {
  constructor(
    @InjectRepository(ParticipantEntity)
    private readonly personaRepository: Repository<ParticipantEntity>,
  ) {}
  async createOrUpdateParticipant(
    participant: Omit<
      ParticipantEntity,
      'id' | 'createdAt' | 'updatedAt' | 'chats' | 'messages'
    >,
  ) {
    const entity = this.personaRepository.create(participant);
    await this.personaRepository.upsert(entity, {
      conflictPaths: ['platform', 'platformUserId'],
    });
    return this.personaRepository.findOneOrFail({
      where: {
        platform: participant.platform,
        platformUserId: participant.platformUserId,
      },
      relations: {
        chats: true,
      },
    });
  }

  findParticipantByPlatformId(platformId: string) {
    return this.personaRepository.findOne({
      where: { platformUserId: platformId },
    });
  }
}
