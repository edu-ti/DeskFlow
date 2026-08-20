import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDataPrivacyTaskDto {
  @IsString()
  @IsNotEmpty()
  deletable_type: string;

  @IsNumber()
  deletable_id: number;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsNumber()
  created_by?: number;
}
