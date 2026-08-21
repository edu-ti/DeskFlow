import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordConsentDto {
  @ApiProperty({ example: '5511999998888', description: 'Número do WhatsApp do cliente (wa_id)' })
  @IsString()
  @IsNotEmpty()
  user_wa_id!: string;

  @ApiPropertyOptional({
    enum: ['manual', 'message_opt_in', 'callback_request'],
    description: 'Método pelo qual o consentimento foi obtido',
  })
  @IsOptional()
  @IsIn(['manual', 'message_opt_in', 'callback_request'])
  method?: string;
}