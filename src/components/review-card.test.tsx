import '@/i18n';
import { fireEvent, render, screen } from '@testing-library/react-native';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import { colors, reviewCardMetrics } from '@/theme/tokens';
import {
  ReviewCard,
  type ReviewCardEntry,
  ReviewCardStack,
  type ReviewPreview,
  selectVisibleReviewCards,
} from './ReviewCard';

const icon = <CalendarDays color={colors.reviewBronzeText} size={17} />;

const previews: ReviewPreview[] = [
  {
    id: 'one',
    type: 'PLANTÃO',
    title: 'Hospital A',
    value: 'R$ 1.000',
    state: 'SEM DATA',
    accent: 'structure',
  },
  {
    id: 'two',
    type: 'PROCEDIMENTO',
    title: 'Hospital B',
    value: 'R$ 2.000',
    state: 'SEM DATA',
    accent: 'bronze',
  },
  {
    id: 'three',
    type: 'PLANTÃO',
    title: 'Hospital C',
    value: 'R$ 3.000',
    state: 'SEM DATA',
    accent: 'structure',
  },
  {
    id: 'four',
    type: 'PLANTÃO',
    title: 'Hospital D',
    value: 'R$ 4.000',
    state: 'SEM DATA',
    accent: 'structure',
  },
  {
    id: 'five',
    type: 'PLANTÃO',
    title: 'Hospital E',
    value: 'R$ 5.000',
    state: 'SEM DATA',
    accent: 'structure',
  },
];

function entry(id: string, tone: 'neutral' | 'attention' = 'neutral'): ReviewCardEntry {
  return {
    id,
    tone,
    icon,
    value: id,
    action: { label: `Abrir ${id}`, kind: tone === 'attention' ? 'check' : 'arrow' },
    onPress: jest.fn(),
  };
}

describe('Review Card visual contract', () => {
  it('compact is one accessible action without a nested preview tray', async () => {
    const onPress = jest.fn();
    await render(
      <ReviewCard
        size="compact"
        icon={icon}
        value="Complete seu primeiro trabalho"
        qualifier="Falta informar o valor"
        previews={previews}
        action={{ label: 'Completar trabalho', kind: 'arrow' }}
        onPress={onPress}
        testID="compact"
      />,
    );
    const card = screen.getByRole('button', { name: /Completar trabalho/ });
    expect(card).toHaveStyle({ minHeight: 44, borderRadius: reviewCardMetrics.compactRadius });
    expect(screen.queryByText('Hospital A')).toBeNull();
    await fireEvent.press(card);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('detailed shows only two previews and summarizes the remaining count', async () => {
    await render(
      <ReviewCard
        size="detailed"
        icon={icon}
        eyebrow="REVISÃO NECESSÁRIA · 5 ENTRADAS"
        value="R$ 5.850"
        qualifier="sem data prevista"
        hint="Comece pelas duas maiores."
        previews={previews}
        totalItems={5}
        action={{ label: 'Adicionar datas', kind: 'arrow' }}
        onPress={() => {}}
        testID="detailed"
      />,
    );
    expect(screen.getByTestId('detailed')).toHaveStyle({
      borderRadius: reviewCardMetrics.regularRadius,
    });
    expect(screen.getByText('Hospital A')).toBeTruthy();
    expect(screen.getByText('Hospital B')).toBeTruthy();
    expect(screen.queryByText('Hospital C')).toBeNull();
    expect(screen.getByText('+ 3 entradas')).toBeTruthy();
  });

  it('uses singular overflow copy for one hidden preview', async () => {
    await render(
      <ReviewCard
        size="detailed"
        icon={icon}
        value="R$ 3.000"
        previews={previews.slice(0, 3)}
        action={{ label: 'Revisar', kind: 'arrow' }}
        onPress={() => {}}
      />,
    );
    expect(screen.getByText('+ 1 entrada')).toBeTruthy();
  });

  it('attention matches the approved surface and delegates confirmation without local success', async () => {
    const onPress = jest.fn();
    await render(
      <ReviewCard
        tone="attention"
        icon={icon}
        eyebrow="ENTRADA PREVISTA PARA HOJE"
        value="R$ 1.200"
        qualifier="Hospital São Lucas"
        hint="Plantão de 12 SET"
        action={{ label: 'Você recebeu?', kind: 'check' }}
        onPress={onPress}
        testID="attention"
      />,
    );
    const card = screen.getByRole('button', { name: /Você recebeu\?/ });
    expect(card).toHaveStyle({
      backgroundColor: colors.reviewAttentionBackground,
      borderColor: colors.reviewAttentionBorder,
    });
    await fireEvent.press(card);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Você recebeu?')).toBeTruthy();
    expect(screen.queryByText('Recebido')).toBeNull();
  });

  it('busy blocks a second request and announces the state', async () => {
    const onPress = jest.fn();
    await render(
      <ReviewCard
        icon={icon}
        value="R$ 850"
        action={{ label: 'Revisar entrada', kind: 'arrow' }}
        onPress={onPress}
        busy
      />,
    );
    const card = screen.getByRole('button', { name: /Revisar entrada/ });
    expect(card.props.accessibilityState).toEqual({ disabled: true, busy: true });
    await fireEvent.press(card);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('stacks no more than two cards and at most one attention card, first', async () => {
    const candidates = [
      entry('neutral-1'),
      entry('attention-1', 'attention'),
      entry('attention-2', 'attention'),
      entry('neutral-2'),
    ];
    expect(selectVisibleReviewCards(candidates).map((card) => card.id)).toEqual([
      'attention-1',
      'neutral-1',
    ]);
    await render(<ReviewCardStack cards={candidates} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.queryByText('attention-2')).toBeNull();
    expect(screen.queryByText('neutral-2')).toBeNull();
  });
});
