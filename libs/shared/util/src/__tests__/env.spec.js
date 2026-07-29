import { describe, it, expect } from 'vitest';
const { validateEnv } = require('../env');

describe('@vami/util — validateEnv', () => {
  it('validates required string variables successfully', () => {
    const mockEnv = { API_KEY: 'secret-123', PORT: '4000' };
    const validated = validateEnv(
      {
        API_KEY: 'string',
        PORT: 'number',
      },
      mockEnv
    );

    expect(validated.API_KEY).toBe('secret-123');
    expect(validated.PORT).toBe(4000);
  });

  it('parses number, boolean, and url types correctly', () => {
    const mockEnv = {
      PORT: '8080',
      ENABLE_FEATURE: 'true',
      API_URL: 'https://api.vami.com',
    };

    const config = validateEnv(
      {
        PORT: { type: 'number', required: true },
        ENABLE_FEATURE: { type: 'boolean', required: true },
        API_URL: { type: 'url', required: true },
      },
      mockEnv
    );

    expect(config.PORT).toBe(8080);
    expect(config.ENABLE_FEATURE).toBe(true);
    expect(config.API_URL).toBe('https://api.vami.com');
  });

  it('applies default values for missing optional variables', () => {
    /** @type {Record<string, string | undefined>} */
    const mockEnv = {};
    const config = validateEnv(
      {
        PORT: { type: 'number', required: false, default: 3000 },
        LOG_LEVEL: { type: 'string', required: false, default: 'info' },
      },
      mockEnv
    );

    expect(config.PORT).toBe(3000);
    expect(config.LOG_LEVEL).toBe('info');
  });

  it('throws aggregated boot error when required variables are missing or malformed', () => {
    const mockEnv = { PORT: 'not-a-number', WEBSITE: 'invalid-url' };

    expect(() =>
      validateEnv(
        {
          MISSING_KEY: { type: 'string', required: true, description: 'Critical DB host' },
          PORT: { type: 'number', required: true },
          WEBSITE: { type: 'url', required: true },
        },
        mockEnv
      )
    ).toThrowError(/BOOT FAILURE/);
  });

  it('supports custom validator functions', () => {
    const mockEnv = { SECRET: 'short' };

    expect(() =>
      validateEnv(
        {
          SECRET: {
            type: 'string',
            required: true,
            validator: (val) => val.length >= 10,
          },
        },
        mockEnv
      )
    ).toThrowError(/failed custom validation check/);
  });

  it('returns a frozen immutable config object', () => {
    /** @type {Record<string, string | undefined>} */
    const emptyEnv = {};
    const config = validateEnv({ MODE: { type: 'string', default: 'test' } }, emptyEnv);
    expect(Object.isFrozen(config)).toBe(true);
  });
});
