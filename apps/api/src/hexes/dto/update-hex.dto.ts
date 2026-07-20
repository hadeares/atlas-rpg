import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { DiscoveryStatus } from '../../database/entities/hex.entity';

export class UpdateHexDto {
  @IsOptional()
  @IsEnum(DiscoveryStatus)
  discoveryStatus?: DiscoveryStatus;

  @IsOptional()
  @IsString()
  @Length(0, 160)
  publicName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  masterNotes?: string;
}
