import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// Тип того, что отдаём клиенту после успешной регистрации/входа.
type AuthResult = {
  user: { id: string; email: string };
  accessToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    // 1. Проверяем что email ещё не занят.
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // 2. Хешируем пароль. 10 = saltRounds (стандарт по балансу скорость/безопасность).
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 3. Создаём юзера в БД.
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash },
      select: { id: true, email: true }, // НЕ возвращаем passwordHash наружу.
    });

    // 4. Сразу выдаём JWT, чтобы фронт не делал лишний логин после регистрации.
    return { user, accessToken: this.signToken(user.id, user.email) };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Сообщение одинаковое для "юзера нет" и "пароль не подошёл" —
    // чтобы не палить какие email зарегистрированы (защита от user enumeration).
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return {
      user: { id: user.id, email: user.email },
      accessToken: this.signToken(user.id, user.email),
    };
  }

  private signToken(sub: string, email: string): string {
    // sub = subject (стандартное JWT поле для id юзера).
    return this.jwt.sign({ sub, email });
  }
}