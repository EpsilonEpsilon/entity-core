import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PlatformType } from '../../core/platform/platform.enum';
import { PersonaEntity } from '../persona/persona.entity';
import type { AccountCredentials } from './types';

@Entity('account')
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PlatformType,
  })
  platform: PlatformType;

  @Column({
    type: 'jsonb',
  })
  credentials: AccountCredentials;

  @ManyToOne(() => PersonaEntity, (persona) => persona.accounts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  persona: PersonaEntity;
}
