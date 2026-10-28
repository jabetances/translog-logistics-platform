import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(error: any, user: any, _info: any, _context: ExecutionContext, _status?: any): TUser {
    if (error || !user) throw error ?? new UnauthorizedException('La sesión no es válida o ha caducado. Inicia sesión de nuevo.');
    return user as TUser;
  }
}
