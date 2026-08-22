import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateFieldActivityDto {
  @IsOptional()
  @IsNumber()
  ticket_id?: number;

  @IsOptional()
  @IsNumber()
  technician_id?: number;

  @IsOptional()
  @IsNumber()
  organization_id?: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  scheduled_at: string;

  @IsOptional()
  @IsNumber()
  estimated_duration_mins?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class UpdateFieldActivityDto {
  @IsOptional()
  @IsNumber()
  ticket_id?: number;

  @IsOptional()
  @IsNumber()
  technician_id?: number;

  @IsOptional()
  @IsNumber()
  organization_id?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @IsOptional()
  @IsNumber()
  estimated_duration_mins?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  checkin_notes?: string;

  @IsOptional()
  @IsString()
  checkout_notes?: string;
}

export class CheckInDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class CheckOutDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
