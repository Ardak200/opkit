import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';

// Кастомный декоратор @CurrentUser() в контроллере → достаёт req.user.
// Это то, что положила JwtStrategy.validate() (объект {id, email}).
// Без декоратора пришлось бы писать @Req() req: Request и потом req.user — некрасиво.
export interface AuthUser {
  id: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: AuthUser }>();
    return request.user;
  },
);