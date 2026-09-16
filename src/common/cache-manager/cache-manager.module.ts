import { Module } from '@nestjs/common';
import CacheManagerService from './cache-manager.service';

@Module({
  providers: [CacheManagerService],
  exports: [CacheManagerService],
})
class CacheManagerModule {}

export default CacheManagerModule;
