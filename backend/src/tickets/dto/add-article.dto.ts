import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AddArticleDto {
  @IsString()
  @IsOptional()
  body?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  is_internal?: boolean;
}
