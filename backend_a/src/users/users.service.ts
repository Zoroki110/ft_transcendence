import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type SafeUser = Omit<User, 'password'>;

function toSafe(u: User | null | undefined): SafeUser | null {
  if (!u) return null;
  const { password, ...safe } = u;
  return safe as SafeUser;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(): Promise<SafeUser[]> {
    const users = await this.userRepo.find({ select: ['id', 'username', 'email'] });
    return users as SafeUser[];
  }

  async findOne(id: number): Promise<SafeUser | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    return toSafe(user);
  }

  async findOrCreate(userData: { username: string; email: string }): Promise<SafeUser> {
    let user = await this.userRepo.findOne({ where: { email: userData.email } });
    if (!user) {
      const exists = await this.userRepo.findOne({
        where: [{ username: userData.username }, { email: userData.email }],
        select: ['id'],
      });
      if (exists) throw new ConflictException('Username or email already exists');

      user = this.userRepo.create({
        username: userData.username,
        email: userData.email,
        password: '',
      });
      user = await this.userRepo.save(user);
    }
    return toSafe(user)!;
  }

  async create(dto: CreateUserDto): Promise<SafeUser> {
    const exists = await this.userRepo.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
      select: ['id'],
    });
    if (exists) throw new ConflictException('Username or email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      password: passwordHash,
    });
    const saved = await this.userRepo.save(user);
    return toSafe(saved)!;
  }

  async update(id: number, dto: UpdateUserDto): Promise<SafeUser> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    if (dto.username) {
      const conflictU = await this.userRepo.findOne({
        where: { username: dto.username, id: Not(id) as any },
        select: ['id'],
      });
      if (conflictU) throw new ConflictException('Username or email already exists');
    }
    if (dto.email) {
      const conflictE = await this.userRepo.findOne({
        where: { email: dto.email, id: Not(id) as any },
        select: ['id'],
      });
      if (conflictE) throw new ConflictException('Username or email already exists');
    }

    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 12);
    }

    await this.userRepo.update(id, {
      ...dto,
      ...(passwordHash ? { password: passwordHash } : {}),
    });

    const updated = await this.userRepo.findOne({ where: { id } });
    if (!updated) throw new NotFoundException(`User ${id} not found after update`);
    return toSafe(updated)!;
  }

  async remove(id: number): Promise<void> {
    await this.userRepo.delete(id);
  }

  async findOneRawByEmail(email: string) {
  return this.userRepo.findOne({ where: { email } }); // avec password
}

}
