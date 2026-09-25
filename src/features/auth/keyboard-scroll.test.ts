import type { ScrollView, View } from 'react-native';
import { focusedFieldScrollOffset, revealFocusedField } from './keyboard-scroll';

describe('focused login field scroll', () => {
  it('does not move the screen if the field already fits above the keyboard', () => {
    expect(focusedFieldScrollOffset(0, 300, 354, 0, 500)).toBe(0);
  });

  it('moves just enough to reveal a field covered by the keyboard', () => {
    expect(focusedFieldScrollOffset(0, 470, 524, 0, 500)).toBe(40);
  });

  it('brings an earlier field back down when switching focus', () => {
    expect(focusedFieldScrollOffset(100, -20, 34, 0, 500)).toBe(64);
  });

  it('measures the visible area and moves the focused field without user scrolling', () => {
    const viewport = {
      measureInWindow: (callback: (...rect: number[]) => void) => callback(0, 0, 390, 500),
    } as Pick<View, 'measureInWindow'>;
    const field = {
      measureInWindow: (callback: (...rect: number[]) => void) => callback(32, 470, 326, 54),
    } as Pick<View, 'measureInWindow'>;
    const scroll = { scrollTo: jest.fn() } as Pick<ScrollView, 'scrollTo'>;

    revealFocusedField(viewport, field, scroll, () => 0);
    expect(scroll.scrollTo).toHaveBeenCalledWith({ y: 40, animated: true });
  });
});
