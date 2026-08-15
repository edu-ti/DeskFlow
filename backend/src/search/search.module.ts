import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';
import { SearchSyncListener } from './search-sync.listener';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node: configService.get<string>('ELASTICSEARCH_NODE', 'http://localhost:9200'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [SearchService, SearchSyncListener],
  exports: [SearchService],
})
export class SearchModule {}
