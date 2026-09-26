import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

@InputType()
export class SendOtpInput {
  @Field()
  @IsNotEmpty()
  @Matches(/^[0-9]{10}$/, { message: 'Mobile number must be a 10-digit number' })
  mobile: string;
}

@InputType()
export class VerifyOtpInput {
  @Field()
  @IsNotEmpty()
  @Matches(/^[0-9]{10}$/, { message: 'Mobile number must be a 10-digit number' })
  mobile: string;

  @Field()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  otp: string;
}

@InputType()
export class RegisterInput {
  @Field()
  @IsNotEmpty()
  @Matches(/^[0-9]{10}$/)
  mobile: string;

  @Field()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;

  @Field()
  @IsNotEmpty()
  accountName: string;

  @Field()
  @IsNotEmpty()
  @Length(6, 6, { message: 'PIN must be exactly 6 digits' })
  pin: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  verificationToken?: string;
}

@InputType()
export class LoginInput {
  @Field()
  @IsNotEmpty()
  @Matches(/^[0-9]{10}$/)
  mobile: string;

  @Field()
  @IsNotEmpty()
  @Length(6, 6)
  pin: string;
}

@InputType()
export class ResetPinInput {
  @Field()
  @IsNotEmpty()
  @Matches(/^[0-9]{10}$/)
  mobile: string;

  @Field()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;

  @Field()
  @IsNotEmpty()
  @Length(6, 6)
  newPin: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  verificationToken?: string;
}

@ObjectType()
export class UserType {
  @Field()
  id: string;

  @Field()
  accountName: string;

  @Field()
  mobile: string;

  @Field({ nullable: true })
  email?: string;

  @Field(() => [String], { nullable: true })
  roles?: string[];

  @Field({ nullable: true })
  isVerified?: boolean;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  createdAt?: Date;
}

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field(() => UserType)
  user: UserType;
}

@ObjectType()
export class SimpleStatusResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field({ nullable: true })
  verificationToken?: string;
}
