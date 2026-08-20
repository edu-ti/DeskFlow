import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('tags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @Roles('admin', 'agent')
  findAll() {
    return this.tagsService.findAll();
  }

  @Get('ticket/:ticketId')
  @Roles('admin', 'agent', 'customer')
  getTicketTags(@Param('ticketId') ticketId: string) {
    return this.tagsService.getTicketTags(+ticketId);
  }

  @Post()
  @Roles('admin')
  create(@Body() data: CreateTagDto) {
    return this.tagsService.create(data);
  }

  @Post('ticket/:ticketId')
  @Roles('admin', 'agent')
  assign(@Param('ticketId') ticketId: string, @Body() body: { name: string }) {
    return this.tagsService.assignTag(+ticketId, body.name);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() data: UpdateTagDto) {
    return this.tagsService.update(+id, data);
  }

  @Delete('ticket/:ticketId/:tagId')
  @Roles('admin', 'agent')
  removeFromTicket(@Param('ticketId') ticketId: string, @Param('tagId') tagId: string) {
    return this.tagsService.removeTicketTag(+ticketId, +tagId);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.tagsService.remove(+id);
  }
}
