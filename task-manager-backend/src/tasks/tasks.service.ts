import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './create-task.dto';
import { UpdateTaskDto } from './update-task.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private readonly userService: UsersService,
  ) {}

  async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    const { title, cost, completed, date, username } = createTaskDto;
  
    const user = await this.userService.findOne(username);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
  
    const existingTask = await this.tasksRepository.findOne({
      where: { title, user: { username } },
    });
    if (existingTask) {
      throw new ConflictException('Uma task com este nome já existe');
    }
  
    const existingTasks = await this.tasksRepository.find({
      select: ['id'],
      order: { id: 'ASC' },
    });
    let newId = 1;
    for (const task of existingTasks) {
      if (task.id === newId) {
        newId++;
      } else {
        break;
      }
    }
  
    const task = this.tasksRepository.create({
      id: newId,
      title,
      cost,
      completed,
      date,
      user,
    });
  
    return this.tasksRepository.save(task);
  }

  async findTasksByUser(username: string): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { user: { username: username } },
    });
  }

  async deleteTask(id: number): Promise<void> {
    const taskToDelete = await this.tasksRepository.findOne({ where: { id } });
    if (!taskToDelete) {
      throw new Error('Task not found');
    }

    await this.tasksRepository.manager.transaction(async transactionalEntityManager => {
      await transactionalEntityManager.delete(Task, id);

      const tasksToUpdate = await transactionalEntityManager.find(Task, {
        where: {
          id: MoreThan(id)
        },
        order: { id: 'ASC' },
      });

      for (const task of tasksToUpdate) {
        await transactionalEntityManager.update(
          Task,
          { id: task.id },
          { id: task.id - 1 }
        );
      }
    });
  }

  async updateTask(id: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new Error('Task not found');
    }

    Object.assign(task, updateTaskDto);

    return this.tasksRepository.save(task);
  }
}
