import { APP_NAME } from '@/config/app';

describe('path alias @/', () => {
  it('resolves src/ modules in Jest', () => {
    expect(APP_NAME).toBe('DOKH');
  });
});
