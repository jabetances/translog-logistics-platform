import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/user.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}
  async onModuleInit() {
    const email = this.config
      .get<string>('BOOTSTRAP_SUPERVISOR_EMAIL')
      ?.toLowerCase();
    const password = this.config.get<string>('BOOTSTRAP_SUPERVISOR_PASSWORD');
    if (!email || !password) return;
    if (await this.users.count({ where: { role: UserRole.SUPERVISOR } }))
      return;
    const existing = await this.users.findOne({ where: { email } });
    if (existing && existing.role !== UserRole.SUPERVISOR) {
      throw new Error(
        'BOOTSTRAP_SUPERVISOR_EMAIL ya pertenece a una cuenta que no es supervisora; elige otro correo en backend/.env.',
      );
    }
    await this.users
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        email,
        fullName:
          this.config.get<string>('BOOTSTRAP_SUPERVISOR_NAME') ??
          'Supervisor inicial',
        role: UserRole.SUPERVISOR,
        passwordHash: await bcrypt.hash(password, 12),
        mustChangePassword: true,
      })
      .orIgnore()
      .execute();
    if (!(await this.users.count({ where: { role: UserRole.SUPERVISOR } }))) {
      throw new Error(
        'No se pudo crear la cuenta de supervisión inicial; revisa el correo configurado.',
      );
    }
  }
  async register(dto: RegisterDto) {
    const existing = await this.users.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('El correo ya está registrado');
    const user = await this.users.save(
      this.users.create({
        email: dto.email.toLowerCase(),
        fullName: dto.fullName,
        role: dto.role,
        passwordHash: await bcrypt.hash(dto.password, 12),
        mustChangePassword: false,
      }),
    );
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
  }
  async login(dto: LoginDto) {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: dto.email.toLowerCase() })
      .getOne();
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash)))
      throw new UnauthorizedException('Credenciales inválidas');
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }
}
