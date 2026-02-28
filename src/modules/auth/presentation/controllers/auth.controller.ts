import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RegisterDto } from '../../application/dto/register.dto';
import { LoginDto } from '../../application/dto/login.dto';
import { VerifyOtpDto } from '../../application/dto/otp.dto';
import { RefreshTokenDto } from '../../application/dto/refresh-token.dto';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../../application/dto/password.dto';
import { GoogleLoginDto } from '../../application/dto/google-login.dto';
import { FacebookLoginDto } from '../../application/dto/facebook-login.dto';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.usecase';
import { VerifyRegistrationUseCase } from '../../application/use-cases/verify-registration.usecase';
import { LoginUserUseCase } from '../../application/use-cases/login-user.usecase';
import { LogoutUserUseCase } from '../../application/use-cases/logout-user.usecase';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.usecase';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.usecase';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.usecase';
import { GoogleLoginUseCase } from '../../application/use-cases/google-login.usecase';
import { FacebookLoginUseCase } from '../../application/use-cases/facebook-login.usecase';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly verifyRegistrationUseCase: VerifyRegistrationUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly logoutUserUseCase: LogoutUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly googleLoginUseCase: GoogleLoginUseCase,
    private readonly facebookLoginUseCase: FacebookLoginUseCase,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() dto: RegisterDto) {
    return this.registerUserUseCase.execute(dto);
  }

  @Public()
  @Post('verify-registration')
  @HttpCode(HttpStatus.CREATED)
  async verifyRegistration(
    @Body() dto: VerifyOtpDto & RegisterDto,
  ) {
    return this.verifyRegistrationUseCase.execute(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.loginUserUseCase.execute(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    const token = req.headers.authorization?.split(' ')[1] || '';
    return this.logoutUserUseCase.execute(userId, token);
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.changePasswordUseCase.execute(userId, dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.forgotPasswordUseCase.sendResetOtp(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.forgotPasswordUseCase.resetPassword(dto);
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body() dto: GoogleLoginDto) {
    return this.googleLoginUseCase.execute(dto.idToken);
  }

  @Public()
  @Post('facebook')
  @HttpCode(HttpStatus.OK)
  async facebookLogin(@Body() dto: FacebookLoginDto) {
    return this.facebookLoginUseCase.execute(dto.accessToken);
  }
}
