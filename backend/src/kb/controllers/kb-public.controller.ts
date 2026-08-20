import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { KbPublicService } from '../services/kb-public.service';
import { JwtAuthGuard } from '../../iam/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../iam/interfaces/authenticated-request.interface';

@Controller('kb')
@UseGuards(JwtAuthGuard)
export class KbPublicController {
  constructor(private readonly kbPublicService: KbPublicService) {}

  @Get('categories')
  getCategories() {
    return this.kbPublicService.getCategories();
  }

  @Get('articles')
  searchArticles(
    @Query('q') query: string,
    @Query('category_id') categoryId: string,
    @Request() req: AuthenticatedRequest
  ) {
    const roles = req.user?.roles || [];
    return this.kbPublicService.searchArticles(query, categoryId ? +categoryId : undefined, roles);
  }

  @Get('articles/:id')
  getArticleById(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const roles = req.user?.roles || [];
    return this.kbPublicService.getArticleById(+id, roles);
  }
}
