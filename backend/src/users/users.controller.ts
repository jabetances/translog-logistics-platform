import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { User, UserRole } from "./user.entity.js";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERVISOR)
@Controller("users")
export class UsersController {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  @Get()
  @ApiOperation({ summary: "Listar usuarios (solo supervisor)" })
  list() {
    return this.users.find({
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
      order: { createdAt: "DESC" },
    });
  }
}
