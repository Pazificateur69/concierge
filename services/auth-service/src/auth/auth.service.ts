import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import type { JwtPayload, LoginResponse, RefreshResponse, User as UserDto } from '@concierge/types';
import { LoginDto, RefreshDto, RegisterDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<UserDto> {
    const existing = await this.userModel.findOne({ tenantId: dto.tenantId, email: dto.email.toLowerCase() });
    if (existing) throw new ConflictException('Email already registered for this tenant');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({
      tenantId: dto.tenantId,
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      locale: 'fr',
    });
    return this.toDto(user);
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase(), active: true });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user);
    await this.persistRefreshToken(user, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toDto(user),
    };
  }

  async refresh(dto: RefreshDto): Promise<RefreshResponse> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.type !== 'refresh') throw new UnauthorizedException('Wrong token type');

    const user = await this.userModel.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');
    const stored = user.refreshTokens.find((t) => t.token === dto.refreshToken);
    if (!stored) throw new UnauthorizedException('Refresh token revoked');

    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== dto.refreshToken);
    const tokens = await this.generateTokens(user);
    user.refreshTokens.push({
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      createdAt: new Date(),
    });
    await user.save();
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { $pull: { refreshTokens: { token: refreshToken } } });
  }

  async me(userId: string): Promise<UserDto> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.toDto(user);
  }

  private async generateTokens(user: UserDocument): Promise<{ accessToken: string; refreshToken: string }> {
    const base: Omit<JwtPayload, 'type'> = {
      sub: user._id.toString(),
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    };
    const accessToken = await this.jwtService.signAsync(
      { ...base, type: 'access' },
      { secret: process.env.JWT_SECRET || 'dev_secret_change_me', expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    );
    const refreshToken = await this.jwtService.signAsync(
      { ...base, type: 'refresh' },
      { secret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret', expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' },
    );
    return { accessToken, refreshToken };
  }

  private async persistRefreshToken(user: UserDocument, token: string): Promise<void> {
    user.refreshTokens = user.refreshTokens.filter((t) => t.expiresAt.getTime() > Date.now());
    user.refreshTokens.push({
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      createdAt: new Date(),
    });
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    await user.save();
  }

  private toDto(user: UserDocument): UserDto {
    return {
      id: user._id.toString(),
      tenantId: user.tenantId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      locale: user.locale,
      createdAt: (user as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }
}
