import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsNumber()
  group_id?: number;

  @IsOptional()
  @IsNumber()
  state_id?: number;

  @IsOptional()
  @IsNumber()
  customer_id?: number;

  @IsString()
  @IsNotEmpty()
  initial_article_body: string;
}
