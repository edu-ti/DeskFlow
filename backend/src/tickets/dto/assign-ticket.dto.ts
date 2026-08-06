import { IsNumber, IsOptional } from 'class-validator';

export class AssignTicketDto {
  @IsNumber()
  @IsOptional()
  owner_id: number;
}
