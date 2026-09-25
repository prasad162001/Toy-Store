import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { SendOtpInput, VerifyOtpInput, RegisterInput, LoginInput, ResetPinInput, AuthResponse, SimpleStatusResponse } from './dto/auth.dto';
import { RoleName } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async sendOtp(input: SendOtpInput): Promise<SimpleStatusResponse> {
    // Development OTP is always 123456
    return {
      success: true,
      message: `OTP sent successfully to ${input.mobile}. (Development mode OTP: 123456)`,
    };
  }

  async verifyOtp(input: VerifyOtpInput): Promise<SimpleStatusResponse> {
    if (input.otp !== '123456') {
      throw new BadRequestException('Invalid or expired OTP. Use development OTP 123456');
    }
    return {
      success: true,
      message: 'OTP verified successfully',
    };
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    if (input.otp !== '123456') {
      throw new BadRequestException('Invalid or expired OTP. Use development OTP 123456');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { mobile: input.mobile },
    });

    if (existingUser) {
      throw new BadRequestException('Mobile number is already registered. Please log in instead.');
    }

    const pinHash = await bcrypt.hash(input.pin, 10);

    const customerRole = await this.prisma.role.findUnique({
      where: { name: RoleName.CUSTOMER },
    });

    if (!customerRole) {
      throw new BadRequestException('Customer role not initialized in database');
    }

    const user = await this.prisma.user.create({
      data: {
        accountName: input.accountName,
        mobile: input.mobile,
        pinHash,
        isVerified: true,
        userRoles: {
          create: {
            roleId: customerRole.id,
          },
        },
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    const roles = user.userRoles.map((ur) => ur.role.name);
    const accessToken = this.jwtService.sign({ sub: user.id, mobile: user.mobile, roles });

    return {
      accessToken,
      user: {
        id: user.id,
        accountName: user.accountName,
        mobile: user.mobile,
        email: user.email,
        roles,
      },
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { mobile: input.mobile },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid mobile number or inactive account');
    }

    const isPinValid = await bcrypt.compare(input.pin, user.pinHash);
    if (!isPinValid) {
      throw new UnauthorizedException('Invalid 6-digit PIN');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const accessToken = this.jwtService.sign({ sub: user.id, mobile: user.mobile, roles });

    return {
      accessToken,
      user: {
        id: user.id,
        accountName: user.accountName,
        mobile: user.mobile,
        email: user.email,
        roles,
      },
    };
  }

  async resetPin(input: ResetPinInput): Promise<SimpleStatusResponse> {
    if (input.otp !== '123456') {
      throw new BadRequestException('Invalid or expired OTP. Use development OTP 123456');
    }

    const user = await this.prisma.user.findUnique({
      where: { mobile: input.mobile },
    });

    if (!user) {
      throw new NotFoundException('Account with this mobile number does not exist');
    }

    const newPinHash = await bcrypt.hash(input.newPin, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { pinHash: newPinHash },
    });

    return {
      success: true,
      message: 'PIN reset successfully. You can now log in with your new PIN.',
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    return {
      id: user.id,
      accountName: user.accountName,
      mobile: user.mobile,
      email: user.email,
      roles,
    };
  }
}
