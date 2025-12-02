import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        profile: true,
        profileUpdatedAt: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        profile: true,
        profileUpdatedAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * 获取用户画像
   */
  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        profile: true,
        profileUpdatedAt: true,
      },
    });

    if (!user?.profile) {
      return null;
    }

    try {
      return {
        ...JSON.parse(user.profile),
        updatedAt: user.profileUpdatedAt,
      };
    } catch {
      return null;
    }
  }

  /**
   * 清除用户画像
   */
  async clearProfile(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        profile: null,
        profileUpdatedAt: null,
      },
    });
  }
}

