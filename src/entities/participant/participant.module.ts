import { Module } from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipantEntity } from './participant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ParticipantEntity])],
  providers: [ParticipantService],
  exports: [ParticipantService],
})
export class ParticipantModule {}
