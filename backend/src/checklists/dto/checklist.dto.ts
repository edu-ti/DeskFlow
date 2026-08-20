import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateChecklistItemDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @IsNumber()
  position?: number;
}
