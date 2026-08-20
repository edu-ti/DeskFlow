import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreatePostmasterFilterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsObject()
  match?: Record<string, any>;

  @IsOptional()
  @IsObject()
  perform?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  prio?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdatePostmasterFilterDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsObject()
  match?: Record<string, any>;

  @IsOptional()
  @IsObject()
  perform?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  prio?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
