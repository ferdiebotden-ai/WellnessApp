import { describe, it, expect } from '@jest/globals';
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  getPasswordStrength,
  getPasswordStrengthLabel,
} from './authValidation';

describe('authValidation', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toEqual({ isValid: true });
      expect(validateEmail('user.name+tag@domain.co.uk')).toEqual({ isValid: true });
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject invalid email format', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });

    it('should trim whitespace', () => {
      expect(validateEmail('  test@example.com  ')).toEqual({ isValid: true });
    });
  });

  describe('validatePassword', () => {
    it('should validate passwords with minimum length', () => {
      expect(validatePassword('password123')).toEqual({ isValid: true });
      expect(validatePassword('12345678')).toEqual({ isValid: true });
    });

    it('should reject empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePassword('short');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters');
    });
  });

  describe('validatePasswordConfirmation', () => {
    it('should validate matching passwords', () => {
      expect(
        validatePasswordConfirmation('password123', 'password123')
      ).toEqual({ isValid: true });
    });

    it('should reject empty confirmation', () => {
      const result = validatePasswordConfirmation('password123', '');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please confirm your password');
    });

    it('should reject non-matching passwords', () => {
      const result = validatePasswordConfirmation('password123', 'password456');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Passwords do not match');
    });
  });

  describe('getPasswordStrength', () => {
    it('should return 0 for empty password', () => {
      expect(getPasswordStrength('')).toBe(0);
    });

    it('should return 1 for password with minimum length', () => {
      expect(getPasswordStrength('password')).toBeGreaterThanOrEqual(1);
    });

    it('should return higher strength for longer passwords', () => {
      const short = getPasswordStrength('password');
      const long = getPasswordStrength('verylongpassword123');
      expect(long).toBeGreaterThan(short);
    });

    it('should return higher strength for passwords with mixed case', () => {
      const lowercase = getPasswordStrength('password123');
      const mixedCase = getPasswordStrength('Password123');
      expect(mixedCase).toBeGreaterThan(lowercase);
    });

    it('should return higher strength for passwords with special characters', () => {
      const noSpecial = getPasswordStrength('Password123');
      const withSpecial = getPasswordStrength('Password123!');
      expect(withSpecial).toBeGreaterThan(noSpecial);
    });
  });

  describe('getPasswordStrengthLabel', () => {
    it('should return correct labels for strength scores', () => {
      expect(getPasswordStrengthLabel(0)).toBe('Weak');
      expect(getPasswordStrengthLabel(1)).toBe('Weak');
      expect(getPasswordStrengthLabel(2)).toBe('Fair');
      expect(getPasswordStrengthLabel(3)).toBe('Good');
      expect(getPasswordStrengthLabel(4)).toBe('Strong');
    });
  });
});

