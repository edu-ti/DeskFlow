import { IsInt, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class TransferTicketDto {
  @IsInt()
  @IsNotEmpty()
  group_id: number;

  @IsOptional()
  @IsInt()
  owner_id?: number;

  @IsString()
  @IsNotEmpty()
  note: string;
}
