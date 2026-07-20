import { IsObject, IsString, Length } from 'class-validator';
import { CreatureStatBlock } from '../../database/entities/creature-template.entity';

export class CreateCustomCreatureDto {
  @IsString()
  @Length(2, 180)
  name: string;

  @IsObject()
  statBlock: CreatureStatBlock;
}
