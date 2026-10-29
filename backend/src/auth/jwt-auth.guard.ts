import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(
    error: any,
    user: any,
    _info: any,
    context: ExecutionContext,
    _status?: any,
  ): TUser {
    if (error || !user)
      throw (
        error ??
        new UnauthorizedException(
          'La sesión no es válida o ha caducado. Inicia sesión de nuevo.',
        )
      );
    if (user.mustChangePassword) {
      const request = context.switchToHttp().getRequest<{
        method: string;
        baseUrl?: string;
        originalUrl?: string;
        url?: string;
        params?: { id?: string };
        body?: Record<string, unknown>;
      }>();
      const body = request.body ?? {};
      const passwordOnly =
        Object.keys(body).length === 1 && typeof body.password === 'string';
      const requestPath = (request.originalUrl ?? request.url ?? '').split(
        '?',
      )[0];
      const usersRoute =
        request.baseUrl?.endsWith('/users') ||
        /\/users\/[^/]+$/.test(requestPath);
      const isOwnPasswordUpdate =
        request.method === 'PATCH' &&
        usersRoute &&
        request.params?.id === user.sub &&
        passwordOnly;
      if (!isOwnPasswordUpdate)
        throw new ForbiddenException(
          'Debes cambiar la contraseña temporal antes de continuar.',
        );
    }
    return user as TUser;
  }
}
