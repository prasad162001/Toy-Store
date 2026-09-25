import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpInput, VerifyOtpInput, RegisterInput, LoginInput, ResetPinInput, AuthResponse, SimpleStatusResponse, UserType } from './dto/auth.dto';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { CurrentUser } from './decorators/auth.decorator';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => SimpleStatusResponse)
  async sendOtp(@Args('input') input: SendOtpInput): Promise<SimpleStatusResponse> {
    return this.authService.sendOtp(input);
  }

  @Mutation(() => SimpleStatusResponse)
  async verifyOtp(@Args('input') input: VerifyOtpInput): Promise<SimpleStatusResponse> {
    return this.authService.verifyOtp(input);
  }

  @Mutation(() => AuthResponse)
  async register(@Args('input') input: RegisterInput): Promise<AuthResponse> {
    return this.authService.register(input);
  }

  @Mutation(() => AuthResponse)
  async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
    return this.authService.login(input);
  }

  @Mutation(() => SimpleStatusResponse)
  async resetPin(@Args('input') input: ResetPinInput): Promise<SimpleStatusResponse> {
    return this.authService.resetPin(input);
  }

  @Query(() => UserType)
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() currentUser: any): Promise<UserType> {
    return this.authService.getCurrentUser(currentUser.id);
  }
}
