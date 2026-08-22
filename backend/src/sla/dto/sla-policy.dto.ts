import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSlaPolicyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  calendar_type?: string;

  @IsOptional()
  @IsNumber()
  priority_id?: number | null;

  @IsOptional()
  @IsNumber()
  group_id?: number | null;

  @IsNumber()
  first_response_mins: number;

  @IsNumber()
  resolution_mins: number;

  @IsOptional()
  @IsNumber()
  onsite_resolution_mins?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateSlaPolicyDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  calendar_type?: string;

  @IsOptional()
  @IsNumber()
  priority_id?: number | null;

  @IsOptional()
  @IsNumber()
  group_id?: number | null;

  @IsOptional()
  @IsNumber()
  first_response_mins?: number;

  @IsOptional()
  @IsNumber()
  resolution_mins?: number;

  @IsOptional()
  @IsNumber()
  onsite_resolution_mins?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
