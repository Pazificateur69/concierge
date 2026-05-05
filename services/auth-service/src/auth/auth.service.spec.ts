import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from './schemas/user.schema';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let jwtService: any;

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
      verifyAsync: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('throws on unknown email', async () => {
      userModel.findOne.mockResolvedValue(null);
      await expect(service.login({ email: 'a@b.fr', password: 'x' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws on wrong password', async () => {
      userModel.findOne.mockResolvedValue({
        passwordHash: await bcrypt.hash('correct', 4),
        active: true,
      });
      await expect(service.login({ email: 'a@b.fr', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens on success', async () => {
      const passwordHash = await bcrypt.hash('correct', 4);
      const fakeUser: any = {
        _id: { toString: () => 'u1' },
        tenantId: 't1',
        email: 'a@b.fr',
        firstName: 'A',
        lastName: 'B',
        role: 'admin',
        locale: 'fr',
        passwordHash,
        active: true,
        refreshTokens: [],
        save: jest.fn(),
      };
      userModel.findOne.mockResolvedValue(fakeUser);
      const res = await service.login({ email: 'a@b.fr', password: 'correct' });
      expect(res.accessToken).toBe('signed-token');
      expect(res.user.email).toBe('a@b.fr');
    });
  });
});
