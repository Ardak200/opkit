import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// @Controller('auth') = префикс /auth для всех роутов внутри.
// Body() с типом DTO → NestJS прогоняет через ValidationPipe.
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK) // POST по умолчанию возвращает 201, но для login логичнее 200.
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }
}