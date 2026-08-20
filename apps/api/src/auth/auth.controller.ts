import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthResponseDto, AuthUserDto, LoginDto, ResetPasswordDto } from './auth.dto';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from './auth.types';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  login(@Body() input: LoginDto): Promise<AuthResponseDto> { return this.auth.login(input); }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AuthUserDto })
  me(@Req() request: AuthenticatedRequest): AuthUserDto {
    const { id, name, email, mustResetPassword } = request.user;
    return { id, name, email, mustResetPassword };
  }

  @Post('reset-password')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AuthResponseDto })
  resetPassword(@Req() request: AuthenticatedRequest, @Body() input: ResetPasswordDto): Promise<AuthResponseDto> {
    return this.auth.resetPassword(request.user, input);
  }
}
