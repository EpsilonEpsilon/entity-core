import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
@Injectable()
class CacheManagerService implements OnModuleInit {
  private logger = new Logger(CacheManagerService.name);
  private redis!: Redis;
  async onModuleInit() {
    try {
      this.redis = Redis.createClient();
    } catch (e) {
      this.logger.error(e);
    }
  }
}

export default CacheManagerService;
