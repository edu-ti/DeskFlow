import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CallActionDto {
  @ApiProperty({ example: 'wacid.HBgL...', description: 'ID da chamada (do webhook connect)' })
  @IsString()
  @IsNotEmpty()
  callId!: string;

  @ApiProperty({ enum: ['pre_accept', 'accept', 'reject', 'terminate'] })
  @IsIn(['pre_accept', 'accept', 'reject', 'terminate'])
  action!: string;

  @ApiPropertyOptional({ description: 'SDP answer (obrigatório para pre_accept/accept)' })
  @IsOptional()
  @IsString()
  sdp?: string;
}