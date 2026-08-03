import { Injectable } from '@nestjs/common';
import { PersonaEntity } from './persona.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PersonaService {
  constructor(
    @InjectRepository(PersonaEntity)
    private readonly personaRepository: Repository<PersonaEntity>,
  ) {}

  public async getListOfPersonas() {
    return await this.personaRepository.find({
      relations: { accounts: true },
    });
  }
}
