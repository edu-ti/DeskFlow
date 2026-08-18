import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CtiLog } from './entities/cti-log.entity';
import { CtiService } from './cti.service';
import { CtiController } from './cti.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CtiLog])],
  controllers: [CtiController],
  providers: [CtiService],
  exports: [CtiService, TypeOrmModule],
})
export class CtiModule {}
