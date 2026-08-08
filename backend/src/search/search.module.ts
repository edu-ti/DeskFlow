import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Article as KbArticle } from '../kb/entities/article.entity';
import { User } from '../iam/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, KbArticle, User]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
