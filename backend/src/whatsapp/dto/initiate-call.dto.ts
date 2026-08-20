import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitiateCallDto {
  @ApiProperty({ example: '5511999998888', description: 'Número do WhatsApp do cliente (callee)' })
  @IsString()
  @IsNotEmpty()
  to!: string;

  @ApiProperty({ description: 'SDP offer (RFC 8866) gerado pelo WebRTC do navegador do agente' })
  @IsString()
  @IsNotEmpty()
  sdp!: string;

  @ApiPropertyOptional({ description: 'String arbitrária para rastreio (retornada nos webhooks)' })
  @IsOptional()
  @IsString()
  biz_opaque_callback_data?: string;
}