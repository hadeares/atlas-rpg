import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { EncounterStatus } from '../../database/entities/random-encounter.entity';

export class UpdateEncounterStatusDto {
  @IsEnum(EncounterStatus)
  status: EncounterStatus;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  resolutionNotes?: string;
}
