import { IsEmail, IsString, MinLength } from 'class-validator';

// DTO = Data Transfer Object. Контракт того, что клиент шлёт в body.
// Декораторы class-validator проверяют поля через глобальный ValidationPipe.
// Если что-то не так — NestJS автоматом вернёт 400 с описанием ошибки.
export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}