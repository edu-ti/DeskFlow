import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MacroAction } from '../entities/macro.entity';

export class CreateMacroDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  actions?: MacroAction[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMacroDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  actions?: MacroAction[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
