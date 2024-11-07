import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
async create(@Body() createUserDto: CreateUserDto) {
  await this.usersService.create(
    createUserDto.username,
    createUserDto.password,
  );
  return { message: 'Register successful' };
}

  @Post('login')
  async login(@Body() loginDto: { username: string; password: string }) {
    const isValid = await this.usersService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    if (isValid) {
      return { message: 'Login successful' };
    }
    return { message: 'Invalid credentials' };
  }
}
