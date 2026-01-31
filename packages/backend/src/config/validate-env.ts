/**
 * Environment Variable Validation
 * Validates that all required environment variables are set on startup
 */

interface RequiredEnvVars {
  [key: string]: {
    required: boolean;
    description: string;
    default?: string;
  };
}

const envVarConfig: RequiredEnvVars = {
  NODE_ENV: {
    required: true,
    description: 'Node environment (development, production, test)',
    default: 'development',
  },
  PORT: {
    required: false,
    description: 'Server port',
    default: '3000',
  },
  DATABASE_URL: {
    required: true,
    description: 'PostgreSQL connection string',
  },
  REDIS_URL: {
    required: false,
    description: 'Redis connection string (optional, will degrade gracefully)',
  },
  JWT_SECRET: {
    required: true,
    description: 'Secret key for JWT token signing',
  },
  JWT_EXPIRES_IN: {
    required: false,
    description: 'JWT token expiration time',
    default: '7d',
  },
  OTP_EXPIRY_MINUTES: {
    required: false,
    description: 'OTP expiration time in minutes',
    default: '10',
  },
  SMTP_HOST: {
    required: false,
    description: 'SMTP server host for email OTP',
  },
  SMTP_PORT: {
    required: false,
    description: 'SMTP server port',
    default: '587',
  },
  SMTP_USER: {
    required: false,
    description: 'SMTP username',
  },
  SMTP_PASSWORD: {
    required: false,
    description: 'SMTP password',
  },
  SMTP_FROM: {
    required: false,
    description: 'Email sender address',
  },
  LIBRETRANSLATE_URL: {
    required: false,
    description: 'LibreTranslate service URL',
  },
  SENTRY_DSN: {
    required: false,
    description: 'Sentry error tracking DSN',
  },
  CORS_ORIGIN: {
    required: false,
    description: 'Allowed CORS origins (comma-separated)',
    default: '*',
  },
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  config: Record<string, string>;
}

/**
 * Validates environment variables and returns validation result
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config: Record<string, string> = {};

  // Check each required variable
  for (const [key, spec] of Object.entries(envVarConfig)) {
    const value = process.env[key];

    if (!value) {
      if (spec.required) {
        errors.push(`Missing required environment variable: ${key} - ${spec.description}`);
      } else if (!spec.default) {
        warnings.push(`Optional environment variable not set: ${key} - ${spec.description}`);
      }
      
      // Use default if available
      if (spec.default) {
        config[key] = spec.default;
      }
    } else {
      config[key] = value;
    }
  }

  // Additional validation rules
  if (config.NODE_ENV === 'production') {
    // In production, certain variables should be set
    if (!process.env.SENTRY_DSN) {
      warnings.push('SENTRY_DSN not set - error tracking will be disabled');
    }
    
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      warnings.push('SMTP credentials not set - email OTP will not work');
    }
    
    if (!process.env.REDIS_URL) {
      warnings.push('REDIS_URL not set - caching will be disabled');
    }
    
    if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
      errors.push('JWT_SECRET is using default value - MUST be changed in production!');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    config,
  };
}

/**
 * Validates environment and exits if validation fails
 * Logs warnings but continues if only warnings exist
 */
export function validateEnvironmentOrExit(): void {
  const result = validateEnvironment();

  console.log('🔍 Validating environment configuration...\n');

  if (result.errors.length > 0) {
    console.error('❌ Environment validation failed:\n');
    result.errors.forEach((error) => console.error(`  - ${error}`));
    console.error('\n💡 Please check your .env file and ensure all required variables are set.\n');
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment validation warnings:\n');
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    console.warn('');
  }

  console.log('✅ Environment validation passed\n');
  
  // Log loaded configuration (without sensitive values)
  console.log('📋 Loaded configuration:');
  console.log(`  - NODE_ENV: ${result.config.NODE_ENV}`);
  console.log(`  - PORT: ${result.config.PORT}`);
  console.log(`  - DATABASE_URL: ${result.config.DATABASE_URL ? '***' : 'not set'}`);
  console.log(`  - REDIS_URL: ${result.config.REDIS_URL ? '***' : 'not set'}`);
  console.log(`  - JWT_SECRET: ${result.config.JWT_SECRET ? '***' : 'not set'}`);
  console.log(`  - SMTP configured: ${result.config.SMTP_HOST ? 'yes' : 'no'}`);
  console.log(`  - Sentry configured: ${result.config.SENTRY_DSN ? 'yes' : 'no'}`);
  console.log(`  - Translation configured: ${result.config.LIBRETRANSLATE_URL ? 'yes' : 'no'}`);
  console.log('');
}
