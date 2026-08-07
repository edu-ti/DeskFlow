import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Article } from '../entities/article.entity';

@Injectable()
export class KbAdminService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,
  ) {}

  // Categories
  async getCategories() {
    return this.categoryRepo.find();
  }

  async createCategory(data: Partial<Category>) {
    const cat = this.categoryRepo.create(data);
    return this.categoryRepo.save(cat);
  }

  async updateCategory(id: number, data: Partial<Category>) {
    await this.categoryRepo.update(id, data);
    return this.categoryRepo.findOne({ where: { id } });
  }

  async deleteCategory(id: number) {
    await this.categoryRepo.delete(id);
    return { deleted: true };
  }

  // Articles
  async getArticles() {
    return this.articleRepo.find({ relations: { category: true, author: true } });
  }

  async getArticleById(id: number) {
    const article = await this.articleRepo.findOne({ where: { id }, relations: { category: true, author: true } });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async createArticle(data: Partial<Article>, authorId: number) {
    const article = this.articleRepo.create({ ...data, author_id: authorId });
    return this.articleRepo.save(article);
  }

  async updateArticle(id: number, data: Partial<Article>) {
    await this.articleRepo.update(id, data);
    return this.getArticleById(id);
  }

  async deleteArticle(id: number) {
    await this.articleRepo.delete(id);
    return { deleted: true };
  }
}
