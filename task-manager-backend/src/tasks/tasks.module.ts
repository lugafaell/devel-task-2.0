import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './tasks.service';
import { TaskController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { UserModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task]), UserModule],
  providers: [TaskService],
  controllers: [TaskController],
})
export class TasksModule {}
