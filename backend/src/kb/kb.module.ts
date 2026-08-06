import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Article } from './entities/article.entity';
import { KbAdminService } from './services/kb-admin.service';
import { KbPublicService } from './services/kb-public.service';
import { KbAdminController } from './controllers/kb-admin.controller';
import { KbPublicController } from './controllers/kb-public.controller';
import { IamModule } from '../iam/iam.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Article]),
    IamModule
  ],
  controllers: [KbAdminController, KbPublicController],
  providers: [KbAdminService, KbPublicService],
})
export class KbModule {}
