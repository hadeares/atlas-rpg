import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Length, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CombatParticipantDto {
  @IsString()
  @Length(1, 60)
  id: string;

  @IsString()
  @Length(1, 120)
  name: string;

  @IsInt()
  @Min(-20)
  @Max(99)
  initiative: number;

  @IsBoolean()
  isPlayerCharacter: boolean;

  @IsOptional()
  @IsInt()
  @Min(-9999)
  @Max(9999)
  hitPoints?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  maxHitPoints?: number;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  notes?: string;
}

export class UpdateCombatDto {
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => CombatParticipantDto)
  participants: CombatParticipantDto[];

  @IsInt()
  @Min(0)
  @Max(999)
  combatRound: number;

  @IsInt()
  @Min(0)
  @Max(29)
  currentTurnIndex: number;
}
