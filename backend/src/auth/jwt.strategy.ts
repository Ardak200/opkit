import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// То что вернётся из validate() — будет доступно в контроллерах как req.user.
export interface JwtPayload {
  sub: string;
  email: string;
}

// PassportStrategy('jwt') = регистрируем стратегию под именем 'jwt'.
// Дальше @UseGuards(AuthGuard('jwt')) или наш JwtAuthGuard будет её использовать.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      // Откуда брать токен. Стандартно — header Authorization: Bearer <token>.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Passport уже проверил подпись и срок жизни — нам остаётся вернуть
  // payload, который попадёт в req.user.
  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email };
  }
}