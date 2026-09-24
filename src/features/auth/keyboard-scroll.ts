import type { ScrollView, View } from 'react-native';

const FIELD_CLEARANCE = 16;

/** Keep only the focused field in view; do not move the screen when it already fits. */
export function focusedFieldScrollOffset(
  currentOffset: number,
  fieldTop: number,
  fieldBottom: number,
  viewportTop: number,
  viewportBottom: number,
): number {
  const above = viewportTop + FIELD_CLEARANCE - fieldTop;
  if (above > 0) return Math.max(0, currentOffset - above);

  const below = fieldBottom + FIELD_CLEARANCE - viewportBottom;
  if (below > 0) return currentOffset + below;

  return currentOffset;
}

/** Measure after the keyboard settles, then move the content without enabling swipe scrolling. */
export function revealFocusedField(
  viewport: Pick<View, 'measureInWindow'>,
  field: Pick<View, 'measureInWindow'>,
  scroll: Pick<ScrollView, 'scrollTo'>,
  getCurrentOffset: () => number,
) {
  viewport.measureInWindow((_, viewportTop, _width, viewportHeight) => {
    field.measureInWindow((_x, fieldTop, _fieldWidth, fieldHeight) => {
      const current = getCurrentOffset();
      const target = focusedFieldScrollOffset(
        current,
        fieldTop,
        fieldTop + fieldHeight,
        viewportTop,
        viewportTop + viewportHeight,
      );
      if (target !== current) scroll.scrollTo({ y: target, animated: true });
    });
  });
}
