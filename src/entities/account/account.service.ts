import { Injectable } from '@nestjs/common';
import { PersonaEntity } from '../persona/persona.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AccountService {}
