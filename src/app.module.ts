import { Module } from '@nestjs/common';
import { AppBootstrapModule } from './core/app-bootstrap/app-bootstrap.module';
import { configuration } from './config/configuration';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './common/database/databse.module';
import { AccountModule } from './entities/account/account.module';
import { ParticipantModule } from './entities/participant/participant.module';
import ChatModule from './entities/chat/chat.module';
import { MessagesModule } from './entities/messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
    DatabaseModule,
    AppBootstrapModule,
    AccountModule,
    ParticipantModule,
    ChatModule,
    MessagesModule,
  ],
})
export class AppModule {}
