import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Overview } from './entities/overview.entity';
import { OverviewsService } from './overviews.service';
import { OverviewsController } from './overviews.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Overview])],
  controllers: [OverviewsController],
  providers: [OverviewsService],
  exports: [OverviewsService, TypeOrmModule],
})
export class OverviewsModule {}
