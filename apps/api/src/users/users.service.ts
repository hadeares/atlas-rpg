import { ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { ILike, Repository } from 'typeorm';
import { User, UserRole } from '../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) {}

  async onModuleInit() {
    const adminCount = await this.usersRepository.count({ where: { role: UserRole.ADMIN } });
    if (adminCount > 0) return;
    const [firstUser] = await this.usersRepository.find({ order: { createdAt: 'ASC' }, take: 1 });
    if (firstUser) {
      firstUser.role = UserRole.ADMIN;
      await this.usersRepository.save(firstUser);
    }
  }

  async findAll(requesterId: string) {
    await this.requireAdmin(requesterId);
    const users = await this.usersRepository.find({ order: { createdAt: 'DESC' } });
    return users.map((user) => this.toPublicUser(user));
  }

  async search(requesterId: string, query: string) {
    await this.requireAuthenticatedUser(requesterId);
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) return [];

    const users = await this.usersRepository.find({
      where: [
        { email: ILike(`%${normalized}%`), isActive: true },
        { displayName: ILike(`%${normalized}%`), isActive: true }
      ],
      take: 20,
      order: { displayName: 'ASC' }
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName
    }));
  }

  async findOne(requesterId: string, userId: string) {
    const requester = await this.requireAuthenticatedUser(requesterId);
    if (requester.id !== userId && requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Você não pode consultar este usuário.');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return this.toPublicUser(user);
  }

  async create(requesterId: string, dto: CreateUserDto) {
    await this.requireAdmin(requesterId);
    const email = dto.email.trim().toLowerCase();
    if (await this.usersRepository.findOne({ where: { email } })) {
      throw new ConflictException('Já existe uma conta com este e-mail.');
    }

    const user = this.usersRepository.create({
      email,
      displayName: dto.displayName.trim(),
      passwordHash: await hash(dto.password, 12),
      role: dto.role ?? UserRole.USER,
      isActive: true
    });
    return this.toPublicUser(await this.usersRepository.save(user));
  }

  async update(requesterId: string, userId: string, dto: UpdateUserDto) {
    const requester = await this.requireAuthenticatedUser(requesterId);
    const isSelf = requester.id === userId;
    if (!isSelf && requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Você não pode editar este usuário.');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      const duplicate = await this.usersRepository.findOne({ where: { email } });
      if (duplicate && duplicate.id !== user.id) throw new ConflictException('Este e-mail já está em uso.');
      user.email = email;
    }
    if (dto.displayName !== undefined) user.displayName = dto.displayName.trim();
    if (dto.password !== undefined) user.passwordHash = await hash(dto.password, 12);
    if (requester.role === UserRole.ADMIN && dto.role !== undefined) user.role = dto.role;
    if (requester.role === UserRole.ADMIN && dto.isActive !== undefined) user.isActive = dto.isActive;

    return this.toPublicUser(await this.usersRepository.save(user));
  }

  async remove(requesterId: string, userId: string) {
    const requester = await this.requireAdmin(requesterId);
    if (requester.id === userId) throw new ForbiddenException('Não é possível excluir sua própria conta pelo painel.');

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    await this.usersRepository.remove(user);
    return { deleted: true, id: userId };
  }

  private async requireAuthenticatedUser(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.isActive) throw new ForbiddenException('Usuário sem acesso.');
    return user;
  }

  private async requireAdmin(userId: string) {
    const user = await this.requireAuthenticatedUser(userId);
    if (user.role !== UserRole.ADMIN) throw new ForbiddenException('Acesso restrito a administradores.');
    return user;
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
