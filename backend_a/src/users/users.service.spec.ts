// backend_a/src/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { Friendship } from '../entities/friendship.entity';
import { Match } from '../entities/match.entity';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let friendshipRepository: Repository<Friendship>;
  let matchRepository: Repository<Match>;

  // Mock repositories
  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockFriendshipRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockMatchRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Friendship),
          useValue: mockFriendshipRepository,
        },
        {
          provide: getRepositoryToken(Match),
          useValue: mockMatchRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    friendshipRepository = module.get<Repository<Friendship>>(
      getRepositoryToken(Friendship),
    );
    matchRepository = module.get<Repository<Match>>(getRepositoryToken(Match));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const expectedUsers = [
        { id: 1, username: 'john', email: 'john@test.com' },
        { id: 2, username: 'jane', email: 'jane@test.com' },
      ];

      mockUserRepository.find.mockResolvedValue(expectedUsers);

      const result = await service.findAll();
      expect(result).toEqual(expectedUsers);
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        select: [
          'id',
          'username',
          'email',
          'avatar',
          'isOnline',
          'displayName',
        ],
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const expectedUser = { id: 1, username: 'john', email: 'john@test.com' };
      mockUserRepository.findOne.mockResolvedValue(expectedUser);

      const result = await service.findOne(1);
      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('setOnlineStatus', () => {
    it('should update user online status', async () => {
      const userId = 1;
      const isOnline = true;

      await service.setOnlineStatus(userId, isOnline);

      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, {
        isOnline,
        lastSeen: expect.any(Date),
      });
    });
  });
});
