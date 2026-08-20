import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTriggerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  event_type?: string;

  @IsOptional()
  @IsArray()
  conditions?: any[];

  @IsOptional()
  @IsArray()
  actions?: any[];
}

export class UpdateTriggerDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  event_type?: string;

  @IsOptional()
  @IsArray()
  conditions?: any[];

  @IsOptional()
  @IsArray()
  actions?: any[];
}
