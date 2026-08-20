import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { KbAdminService } from '../services/kb-admin.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateArticleDto, UpdateArticleDto } from '../dto/kb.dto';
import { JwtAuthGuard } from '../../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/guards/roles.guard';
import { Roles } from '../../iam/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../../iam/interfaces/authenticated-request.interface';

@Controller('kb-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'agent')
export class KbAdminController {
  constructor(private readonly kbAdminService: KbAdminService) {}

  // Categories
  @Get('categories')
  getCategories() {
    return this.kbAdminService.getCategories();
  }

  @Post('categories')
  createCategory(@Body() data: CreateCategoryDto) {
    return this.kbAdminService.createCategory(data);
  }

  @Put('categories/:id')
  updateCategory(@Param('id') id: string, @Body() data: UpdateCategoryDto) {
    return this.kbAdminService.updateCategory(+id, data);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.kbAdminService.deleteCategory(+id);
  }

  // Articles
  @Get('articles')
  getArticles() {
    return this.kbAdminService.getArticles();
  }

  @Get('articles/:id')
  getArticleById(@Param('id') id: string) {
    return this.kbAdminService.getArticleById(+id);
  }

  @Post('articles')
  createArticle(@Body() data: CreateArticleDto, @Request() req: AuthenticatedRequest) {
    return this.kbAdminService.createArticle(data, req.user.id);
  }

  @Put('articles/:id')
  updateArticle(@Param('id') id: string, @Body() data: UpdateArticleDto) {
    return this.kbAdminService.updateArticle(+id, data);
  }

  @Delete('articles/:id')
  deleteArticle(@Param('id') id: string) {
    return this.kbAdminService.deleteArticle(+id);
  }
}
