import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    // registerAsync — потому что нужны переменные из ConfigService,
    // которые доступны только после инициализации ConfigModule.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        // expiresIn принимает формат ms-пакета ("7d", "1h", "30m" итд), но
        // его тип очень узкий template literal — кастуем, чтобы можно было
        // подавать любую валидную строку из .env.
        signOptions: {
          expiresIn: config.getOrThrow<string>('JWT_EXPIRES_IN') as unknown as number,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  // JwtStrategy регистрируется как провайдер → passport находит её по имени 'jwt'.
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}