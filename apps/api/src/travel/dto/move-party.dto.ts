import { IsInt } from 'class-validator';

export class MovePartyDto {
  @IsInt()
  q: number;

  @IsInt()
  r: number;
}
