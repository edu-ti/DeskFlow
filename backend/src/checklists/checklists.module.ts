import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Checklist } from './entities/checklist.entity';
import { ChecklistItem } from './entities/checklist-item.entity';
import { ChecklistsService } from './checklists.service';
import { ChecklistsController } from './checklists.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Checklist, ChecklistItem])],
  controllers: [ChecklistsController],
  providers: [ChecklistsService],
  exports: [ChecklistsService, TypeOrmModule],
})
export class ChecklistsModule {}
