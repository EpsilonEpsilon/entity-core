import { PersonaEntity } from './persona.entity';

export class PersonaContext {
  constructor(private entity: PersonaEntity) {}

  public getEntity(): Readonly<PersonaEntity> {
    return structuredClone(this.entity);
  }
}
