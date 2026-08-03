import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IamModule } from './iam/iam.module';
import { TicketsModule } from './tickets/tickets.module';
import { User } from './iam/entities/user.entity';
import { Group } from './iam/entities/group.entity';
import { Ticket } from './tickets/entities/ticket.entity';
import { Article } from './tickets/entities/article.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'deskflow'),
        password: configService.get<string>('DB_PASS', 'deskflow_password'),
        database: configService.get<string>('DB_NAME', 'deskflow_db'),
        entities: [User, Group, Ticket, Article],
        synchronize: true, // APENAS PARA DESENVOLVIMENTO: cria tabelas automaticamente
      }),
    }),
    IamModule, 
    TicketsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
