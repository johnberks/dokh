import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

describe('useReducedMotion', () => {
  it('lê a preferência do sistema e reage a mudanças', async () => {
    let listener: ((value: boolean) => void) | undefined;
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const fakeAddEventListener = (_event: string, handler: (value: boolean) => void) => {
      listener = handler;
      return { remove: jest.fn() };
    };
    jest
      .spyOn(AccessibilityInfo, 'addEventListener')
      .mockImplementation(
        fakeAddEventListener as unknown as typeof AccessibilityInfo.addEventListener,
      );

    const { result } = await renderHook(() => useReducedMotion());
    await act(async () => {});
    expect(result.current).toBe(true);

    await act(async () => listener?.(false));
    expect(result.current).toBe(false);
  });
});
