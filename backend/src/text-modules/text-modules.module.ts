import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TextModule } from './entities/text-module.entity';
import { TextModulesService } from './text-modules.service';
import { TextModulesController } from './text-modules.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TextModule])],
  controllers: [TextModulesController],
  providers: [TextModulesService],
  exports: [TextModulesService, TypeOrmModule],
})
export class TextModulesModule {}
