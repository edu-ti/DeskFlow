import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ImportService } from './import.service';
import { RolesGuard } from '../iam/guards/roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('csv/preview')
  @Roles('admin')
  preview(@Body() body: { csv: string }) {
    return this.importService.parseCsv(body.csv);
  }

  @Post('csv')
  @Roles('admin')
  importCsv(@Body() body: { rows: Record<string, string>[] }) {
    return this.importService.importCsv(body.rows);
  }

  @Post(':source')
  @Roles('admin')
  importFrom(@Param('source') source: string) {
    return this.importService.importFrom(source);
  }
}
