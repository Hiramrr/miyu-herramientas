import { describe, it, expect } from 'vitest';
import { evaluatePassword, randomPassword } from '../tools/passwordTools.js';

describe('evaluatePassword', () => {
  it('does not rate patterns as strong', () => {
    for (const password of ['aaaaaaaaaaaaa', 'Password1', 'P@ssw0rd2024!', 'abcdefghijklmnop', '1234567890123', 'qwertyuiopasdf', 'abcabcabcabcabc']) {
      expect(evaluatePassword(password).score, password).toBeLessThanOrEqual(1);
    }
  });

  it('rates long random passwords as strong', () => {
    expect(evaluatePassword('x7#Kq9!mPz2@Lw4v').score).toBe(4);
    expect(evaluatePassword('Gx7#q9m').score).toBeLessThanOrEqual(1);
  });
});

describe('randomPassword', () => {
  it('discards values that would bias the modulo', () => {
    const values = [0xffffffff, 5];
    const fake = (array) => { array[0] = values.shift(); return array; };
    expect(randomPassword(1, 'abc', fake)).toBe('c');
    expect(values).toHaveLength(0);
  });
});
