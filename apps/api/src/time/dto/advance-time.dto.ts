import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class AdvanceTimeDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(16)
  steps?: number;
}
