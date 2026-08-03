import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Group } from './entities/group.entity';
import { IamService } from './services/iam.service';
import { IamController } from './iam.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Group])],
  controllers: [IamController],
  providers: [IamService],
  exports: [IamService, TypeOrmModule],
})
export class IamModule {}
