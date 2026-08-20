import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OperatingHoursDto {
  @ApiProperty({ enum: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] })
  @IsIn(['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'])
  day_of_week!: string;

  @ApiProperty({ example: '0800', description: 'Formato HHMM' })
  @IsString()
  @IsNotEmpty()
  open_time!: string;

  @ApiProperty({ example: '1800', description: 'Formato HHMM' })
  @IsString()
  @IsNotEmpty()
  close_time!: string;
}

export class HolidayScheduleDto {
  @ApiProperty({ example: '2026-12-25' })
  @IsString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ example: '0000' })
  @IsString()
  @IsNotEmpty()
  start_time!: string;

  @ApiProperty({ example: '2359' })
  @IsString()
  @IsNotEmpty()
  end_time!: string;
}

export class CallHoursDto {
  @ApiProperty({ enum: ['ENABLED', 'DISABLED'] })
  @IsIn(['ENABLED', 'DISABLED'])
  status!: string;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @IsOptional()
  @IsString()
  timezone_id?: string;

  @ApiPropertyOptional({ type: [OperatingHoursDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingHoursDto)
  weekly_operating_hours?: OperatingHoursDto[];

  @ApiPropertyOptional({ type: [HolidayScheduleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HolidayScheduleDto)
  holiday_schedule?: HolidayScheduleDto[];
}

export class UpdateCallSettingsDto {
  @ApiProperty({ enum: ['ENABLED', 'DISABLED'] })
  @IsIn(['ENABLED', 'DISABLED'])
  status!: string;

  @ApiPropertyOptional({ enum: ['DEFAULT', 'DISABLE_ALL'], description: 'DEFAULT mostra o ícone de ligação no perfil/chat' })
  @IsOptional()
  @IsIn(['DEFAULT', 'DISABLE_ALL'])
  call_icon_visibility?: string;

  @ApiPropertyOptional({ enum: ['ENABLED', 'DISABLED'], description: 'Permite ao cliente pedir retorno de chamada' })
  @IsOptional()
  @IsIn(['ENABLED', 'DISABLED'])
  callback_permission_status?: string;

  @ApiPropertyOptional({ type: CallHoursDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CallHoursDto)
  call_hours?: CallHoursDto;
}