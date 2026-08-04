import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { Group } from './entities/group.entity';
import { Role } from './entities/role.entity';
import { IamService } from './services/iam.service';
import { AuthService } from './services/auth.service';
import { IamController } from './iam.controller';
import { UsersController } from './controllers/users.controller';
import { GroupsController } from './controllers/groups.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Group, Role]),
    JwtModule.register({
      global: true,
      secret: 'deskflow-super-secret-key-change-in-prod', // MUST be in env!
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [IamController, UsersController, GroupsController],
  providers: [IamService, AuthService],
  exports: [IamService, AuthService, TypeOrmModule],
})
export class IamModule {}
