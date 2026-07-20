import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { User, UserRole } from '../database/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.usersRepository.findOne({ where: { email } });

    if (existingUser) {
      throw new ConflictException('Já existe uma conta com este e-mail.');
    }

    const userCount = await this.usersRepository.count();
    const user = this.usersRepository.create({
      email,
      displayName: dto.displayName.trim(),
      passwordHash: await hash(dto.password, 12),
      role: userCount === 0 ? UserRole.ADMIN : UserRole.USER,
      isActive: true
    });

    await this.usersRepository.save(user);
    return this.createSession(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user || !user.isActive || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    return this.createSession(user);
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    return this.toPublicUser(user);
  }

  private async createSession(user: User) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    return {
      accessToken,
      user: this.toPublicUser(user)
    };
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
