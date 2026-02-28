import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { AuthUserRepository } from '../../domain/repositories/auth-user.repository';
import { AuthUser } from '../../domain/entities/auth-user.entity';

@Injectable()
export class PrismaAuthUserRepository implements AuthUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    return user ? new AuthUser(user) : null;
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
    return user ? new AuthUser(user) : null;
  }

  async findByGoogleId(googleId: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { googleId },
      include: { role: true },
    });
    return user ? new AuthUser(user) : null;
  }

  async findByFacebookId(facebookId: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { facebookId },
      include: { role: true },
    });
    return user ? new AuthUser(user) : null;
  }

  async create(data: {
    email: string;
    password?: string;
    roleId: string;
    googleId?: string;
    facebookId?: string;
    isEmailVerified?: boolean;
  }): Promise<AuthUser> {
    // Resolve roleId: if it's a name like 'USER', find the role first
    let resolvedRoleId = data.roleId;
    if (!this.isUUID(data.roleId)) {
      const role = await this.prisma.role.findFirst({
        where: { name: data.roleId },
      });
      if (role) {
        resolvedRoleId = role.id;
      } else {
        // Create default role if it doesn't exist
        const newRole = await this.prisma.role.create({
          data: { name: data.roleId, description: `${data.roleId} role` },
        });
        resolvedRoleId = newRole.id;
      }
    }

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password || null,
        roleId: resolvedRoleId,
        googleId: data.googleId || null,
        facebookId: data.facebookId || null,
        isEmailVerified: data.isEmailVerified ?? false,
      },
      include: { role: true },
    });

    return new AuthUser(user);
  }

  async update(id: string, data: Partial<AuthUser>): Promise<AuthUser> {
    const updateData: any = {};

    if (data.email !== undefined) updateData.email = data.email;
    if (data.password !== undefined) updateData.password = data.password;
    if (data.googleId !== undefined) updateData.googleId = data.googleId;
    if (data.facebookId !== undefined) updateData.facebookId = data.facebookId;
    if (data.isEmailVerified !== undefined)
      updateData.isEmailVerified = data.isEmailVerified;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.lastLoginAt !== undefined) updateData.lastLoginAt = data.lastLoginAt;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    return new AuthUser(user);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  private isUUID(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      str,
    );
  }
}
