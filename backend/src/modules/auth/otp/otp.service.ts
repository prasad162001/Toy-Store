import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface OtpProvider {
  sendOtp(mobile: string): Promise<void>;
  verifyOtp(mobile: string, otp: string): Promise<string>;
  resendOtp(mobile: string): Promise<void>;
  consumeVerificationToken(mobile: string, token: string): boolean;
}

type OtpRecord = {
  code: string;
  expiresAt: number;
  sentAt: number;
  attempts: number;
  windowStartedAt: number;
  sendCount: number;
};

type VerificationRecord = {
  mobile: string;
  expiresAt: number;
};

export class MockOtpProvider implements OtpProvider {
  private readonly records = new Map<string, OtpRecord>();
  private readonly verificationTokens = new Map<string, VerificationRecord>();
  private readonly expiryMs = 5 * 60 * 1000;
  private readonly resendCooldownMs = 30 * 1000;
  private readonly maxAttempts = 5;
  private readonly maxSendsPerHour = 5;

  async sendOtp(mobile: string): Promise<void> {
    const now = Date.now();
    const existing = this.records.get(mobile);
    if (existing && now - existing.sentAt < this.resendCooldownMs) {
      throw new HttpException('Please wait before requesting another OTP', HttpStatus.TOO_MANY_REQUESTS);
    }

    const windowStartedAt = existing && now - existing.windowStartedAt < 60 * 60 * 1000 ? existing.windowStartedAt : now;
    const sendCount = existing && windowStartedAt === existing.windowStartedAt ? existing.sendCount : 0;
    if (sendCount >= this.maxSendsPerHour) {
      throw new HttpException('Too many OTP requests. Please try again later', HttpStatus.TOO_MANY_REQUESTS);
    }

    this.records.set(mobile, {
      code: process.env.DEV_OTP || '123456',
      expiresAt: now + this.expiryMs,
      sentAt: now,
      attempts: 0,
      windowStartedAt,
      sendCount: sendCount + 1,
    });
  }

  async resendOtp(mobile: string): Promise<void> {
    await this.sendOtp(mobile);
  }

  async verifyOtp(mobile: string, otp: string): Promise<string> {
    const record = this.records.get(mobile);
    if (!record || record.expiresAt <= Date.now()) {
      this.records.delete(mobile);
      throw new BadRequestException('Invalid or expired OTP');
    }

    record.attempts += 1;
    if (record.attempts > this.maxAttempts) {
      this.records.delete(mobile);
      throw new HttpException('Too many OTP attempts. Please request a new OTP', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (otp !== record.code) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    this.records.delete(mobile);
    const token = randomUUID();
    this.verificationTokens.set(token, { mobile, expiresAt: Date.now() + this.expiryMs });
    return token;
  }

  consumeVerificationToken(mobile: string, token: string): boolean {
    const record = this.verificationTokens.get(token);
    if (!record || record.mobile !== mobile || record.expiresAt <= Date.now()) {
      this.verificationTokens.delete(token);
      return false;
    }
    this.verificationTokens.delete(token);
    return true;
  }
}

export class Msg91OtpProvider implements OtpProvider {
  private readonly authKey = process.env.MSG91_AUTH_KEY;
  private readonly templateId = process.env.MSG91_TEMPLATE_ID;
  private readonly widgetId = process.env.MSG91_WIDGET_ID;

  async sendOtp(_mobile: string): Promise<void> {
    this.assertConfigured();
    throw new BadRequestException('MSG91 OTP delivery is not configured in this environment');
  }

  async verifyOtp(_mobile: string, _otp: string): Promise<string> {
    this.assertConfigured();
    throw new BadRequestException('MSG91 OTP verification is not configured in this environment');
  }

  async resendOtp(_mobile: string): Promise<void> {
    this.assertConfigured();
    throw new BadRequestException('MSG91 OTP delivery is not configured in this environment');
  }

  consumeVerificationToken(_mobile: string, _token: string): boolean {
    return false;
  }

  private assertConfigured() {
    if (!this.authKey || !this.templateId || !this.widgetId) {
      throw new BadRequestException('MSG91 OTP configuration is incomplete');
    }
  }
}

@Injectable()
export class OtpService implements OtpProvider {
  private readonly provider: OtpProvider;

  constructor() {
    this.provider = process.env.OTP_PROVIDER === 'msg91' ? new Msg91OtpProvider() : new MockOtpProvider();
  }

  sendOtp(mobile: string) {
    return this.provider.sendOtp(mobile);
  }

  verifyOtp(mobile: string, otp: string) {
    return this.provider.verifyOtp(mobile, otp);
  }

  resendOtp(mobile: string) {
    return this.provider.resendOtp(mobile);
  }

  consumeVerificationToken(mobile: string, token: string) {
    return this.provider.consumeVerificationToken(mobile, token);
  }
}
