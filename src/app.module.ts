import { Module } from '@nestjs/common';
import { AppBootstrapModule } from './core/app-bootstrap/app-bootstrap.module';
import { configuration } from './config/configuration';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './common/database/databse.module';
import { AccountModule } from './entities/account/account.module';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
    DatabaseModule,
    AppBootstrapModule,
    AccountModule,
  ],
})
export class AppModule {}
