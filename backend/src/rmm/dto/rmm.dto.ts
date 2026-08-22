import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class IngestHeartbeatDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Hostname

  @IsOptional()
  @IsNumber()
  organization_id?: number;

  @IsOptional()
  @IsString()
  device_type?: string;

  @IsOptional()
  @IsString()
  os_name?: string;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsString()
  mac_address?: string;

  @IsOptional()
  @IsString()
  cpu_model?: string;

  @IsOptional()
  @IsNumber()
  cpu_usage_percent?: number;

  @IsOptional()
  @IsNumber()
  ram_total_gb?: number;

  @IsOptional()
  @IsNumber()
  ram_usage_percent?: number;

  @IsOptional()
  @IsNumber()
  disk_total_gb?: number;

  @IsOptional()
  @IsNumber()
  disk_used_gb?: number;

  @IsOptional()
  @IsNumber()
  disk_usage_percent?: number;

  @IsOptional()
  @IsString()
  agent_version?: string;
}

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsNumber()
  organization_id?: number;

  @IsOptional()
  @IsNumber()
  assigned_user_id?: number;

  @IsOptional()
  @IsString()
  device_type?: string;

  @IsOptional()
  @IsString()
  os_name?: string;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsString()
  mac_address?: string;

  @IsOptional()
  @IsString()
  cpu_model?: string;

  @IsOptional()
  @IsNumber()
  ram_total_gb?: number;

  @IsOptional()
  @IsNumber()
  disk_total_gb?: number;
}
