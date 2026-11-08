import { passwordSchema, phoneSchema, strongPasswordSchema } from './validation';

describe('phoneSchema', () => {
  const schema = phoneSchema('invalid');

  it('accepts a valid 0-prefixed mobile number', () => {
    expect(schema.safeParse('0901234567').success).toBe(true);
  });

  it('accepts a valid +84-prefixed mobile number', () => {
    expect(schema.safeParse('+84901234567').success).toBe(true);
  });

  it('strips internal spaces before validating', () => {
    const result = schema.safeParse('090 123 4567');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('0901234567');
  });

  it('rejects a carrier prefix not issued to mobiles', () => {
    expect(schema.safeParse('0211234567').success).toBe(false);
  });

  it('rejects a too-short number', () => {
    expect(schema.safeParse('090123').success).toBe(false);
  });
});

describe('passwordSchema', () => {
  const schema = passwordSchema('too short');

  it('accepts a 6-character password', () => {
    expect(schema.safeParse('abcdef').success).toBe(true);
  });

  it('rejects a 5-character password', () => {
    expect(schema.safeParse('abcde').success).toBe(false);
  });

  it('does not require a mix of letters and digits', () => {
    expect(schema.safeParse('aaaaaa').success).toBe(true);
  });
});

describe('strongPasswordSchema', () => {
  const schema = strongPasswordSchema('too weak');

  it('accepts an 8-character password with both letters and digits', () => {
    expect(schema.safeParse('abcd1234').success).toBe(true);
  });

  it('rejects an all-digit 8-character password', () => {
    expect(schema.safeParse('12345678').success).toBe(false);
  });

  it('rejects an all-letter 8-character password', () => {
    expect(schema.safeParse('abcdefgh').success).toBe(false);
  });

  it('rejects a 7-character password even with letters and digits', () => {
    expect(schema.safeParse('abcd123').success).toBe(false);
  });
});
