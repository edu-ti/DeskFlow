import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  group_id: number;

  @IsNumber()
  state_id: number;

  @IsNumber()
  customer_id: number;

  @IsString()
  @IsNotEmpty()
  initial_article_body: string;
}
