import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonaEntity } from './persona.entity';
import { PersonaService } from './persona.service';

@Module({
  imports: [TypeOrmModule.forFeature([PersonaEntity])],
  providers: [PersonaService],
  exports: [PersonaService],
})
export class PersonaModule {}
