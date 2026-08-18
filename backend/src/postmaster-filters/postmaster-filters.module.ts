import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostmasterFilter } from './entities/postmaster-filter.entity';
import { PostmasterFiltersService } from './postmaster-filters.service';
import { PostmasterFiltersController } from './postmaster-filters.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PostmasterFilter])],
  controllers: [PostmasterFiltersController],
  providers: [PostmasterFiltersService],
  exports: [PostmasterFiltersService, TypeOrmModule],
})
export class PostmasterFiltersModule {}
