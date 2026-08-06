import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Article } from '../entities/article.entity';

@Injectable()
export class KbPublicService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,
  ) {}

  async getCategories() {
    return this.categoryRepo.find();
  }

  async searchArticles(query: string, categoryId?: number, userRoles: string[] = []) {
    const isAgent = userRoles.includes('admin') || userRoles.includes('agent');
    
    let qb = this.articleRepo.createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.author', 'author')
      .where('article.is_published = :published', { published: true });

    if (!isAgent) {
      qb = qb.andWhere('article.is_internal = :internal', { internal: false });
    }

    if (query) {
      qb = qb.andWhere('(article.title ILIKE :query OR article.content ILIKE :query)', { query: `%${query}%` });
    }

    if (categoryId) {
      qb = qb.andWhere('article.category_id = :categoryId', { categoryId });
    }

    return qb.getMany();
  }

  async getArticleById(id: number, userRoles: string[] = []) {
    const isAgent = userRoles.includes('admin') || userRoles.includes('agent');

    const qb = this.articleRepo.createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.author', 'author')
      .where('article.id = :id', { id })
      .andWhere('article.is_published = :published', { published: true });

    if (!isAgent) {
      qb.andWhere('article.is_internal = :internal', { internal: false });
    }

    const article = await qb.getOne();
    
    if (!article) {
      throw new NotFoundException('Article not found or not available');
    }

    return article;
  }
}
