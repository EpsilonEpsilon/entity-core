import { Module } from '@nestjs/common';
import MessageHistoryService from './message-history.service';
import { MessagesModule } from '../../entities/messages/messages.module';

@Module({
  imports: [MessagesModule],
  providers: [MessageHistoryService],
  exports: [MessageHistoryService],
})
class MessageHistoryModule {}

export default MessageHistoryModule;
