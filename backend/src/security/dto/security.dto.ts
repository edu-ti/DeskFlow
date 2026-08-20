import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePgpKeyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  public_key: string;

  @IsOptional()
  @IsString()
  private_key?: string;

  @IsOptional()
  @IsString()
  fingerprint?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expires_at?: Date;
}

export class UpdatePgpKeyDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  public_key?: string;

  @IsOptional()
  @IsString()
  private_key?: string;

  @IsOptional()
  @IsString()
  fingerprint?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expires_at?: Date;
}

export class CreateSmimeCertificateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  certificate: string;

  @IsOptional()
  @IsString()
  private_key?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  fingerprint?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expires_at?: Date;
}

export class UpdateSmimeCertificateDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  certificate?: string;

  @IsOptional()
  @IsString()
  private_key?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  fingerprint?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expires_at?: Date;
}

export class CreateSslCertificateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  certificate: string;

  @IsOptional()
  @IsString()
  private_key?: string;

  @IsOptional()
  @IsString()
  hostname?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expires_at?: Date;
}

export class UpdateSslCertificateDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  certificate?: string;

  @IsOptional()
  @IsString()
  private_key?: string;

  @IsOptional()
  @IsString()
  hostname?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expires_at?: Date;
}
