import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Тонкая обёртка над AuthGuard('jwt'). Зачем отдельный класс?
// Чтобы в контроллерах было @UseGuards(JwtAuthGuard) вместо @UseGuards(AuthGuard('jwt')).
// Плюс — сюда удобно потом докрутить кастомную логику (логирование, exception messages).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}