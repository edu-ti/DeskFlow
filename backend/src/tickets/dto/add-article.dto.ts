import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddArticleDto {
  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsOptional()
  is_internal?: boolean;
}
