import { IsNumber } from 'class-validator';

export class ChangeStateDto {
  @IsNumber()
  state_id: number;
}
