import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('task')
export class Task {
  @PrimaryColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  cost: string;

  @Column({ default: false })
  completed: boolean;

  @Column()
  date: string;

  @ManyToOne(() => User, (user) => user.tasks)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
