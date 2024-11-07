import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'db',
      port: 5432,
      username: 'develtask_user',
      password: '200565',
      database: 'devel_task',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      extra: {
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      },
    }),
    UserModule,
    TasksModule,
  ],
})
export class AppModule {}
