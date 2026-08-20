import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTimeAccountingDto {
  @IsNumber()
  ticket_id: number;

  @IsOptional()
  @IsNumber()
  minutes?: number;

  @IsOptional()
  @IsString()
  activity?: string;
}

export class UpdateTimeAccountingDto {
  @IsOptional()
  @IsNumber()
  ticket_id?: number;

  @IsOptional()
  @IsNumber()
  minutes?: number;

  @IsOptional()
  @IsString()
  activity?: string;
}
