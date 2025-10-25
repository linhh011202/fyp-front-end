/**
 * Authentication Module
 * 
 * Central export file for all authentication-related functionality
 * Import from here for convenient access to auth features
 */

// Services
export * from './auth.service';
export * from './plans.service';

// Re-export with named imports for convenience
export { authService } from './auth.service';
export type {
  ApiError,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyTokenRequest,
  RefreshTokenRequest,
  VerifyTokenResponse,
  RefreshTokenResponse,
} from './auth.service';
