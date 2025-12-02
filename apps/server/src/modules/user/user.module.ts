import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserProfileService } from './user-profile.service';
import { UserController } from './user.controller';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [forwardRef(() => ChatModule)],
  controllers: [UserController],
  providers: [UserService, UserProfileService],
  exports: [UserService, UserProfileService],
})
export class UserModule {}

