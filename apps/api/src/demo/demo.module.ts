import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';

@Module({ imports: [UsersModule], controllers: [DemoController], providers: [DemoService] })
export class DemoModule {}
