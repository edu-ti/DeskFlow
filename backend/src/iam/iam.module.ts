import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'dev-secret-change-in-env'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [IamController, UsersController, GroupsController],
  providers: [IamService, AuthService],
  exports: [IamService, AuthService, TypeOrmModule],
})
export class IamModule {}
