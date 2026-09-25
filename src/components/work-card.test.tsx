import '@/i18n';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { colors, workCardMetrics, workLocationColors } from '@/theme/tokens';
import { PrimitivesCatalog } from './PrimitivesCatalog';
import { WorkCard } from './WorkCard';

describe('Work Card visual contract', () => {
  it('Agenda card exposes time, kind, place, value and status, not only location color', async () => {
    const onPress = jest.fn();
    await render(
      <WorkCard
        variant="agenda"
        locationColor="blue"
        time="07:00"
        kind="Plantão · 12h"
        place="Hospital São Camilo"
        value="R$ 1.400"
        payment={{ state: 'scheduled', label: 'Recebe 5 OUT' }}
        onPress={onPress}
        testID="agenda-work"
      />,
    );
    const card = screen.getByRole('button', {
      name: /07:00, Plantão · 12h, Hospital São Camilo, R\$ 1.400, Recebe 5 OUT/,
    });
    expect(card).toHaveStyle({ minHeight: 44, borderRadius: workCardMetrics.radius });
    expect(screen.getByTestId('agenda-work-color')).toHaveStyle({
      backgroundColor: workLocationColors.blue,
      width: workCardMetrics.agendaBarWidth,
    });
    expect(screen.getByText('Recebe 5 OUT')).toHaveStyle({ color: colors.textMuted });
    await fireEvent.press(card);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('received is a discrete check and text, not an assumed state or a badge', async () => {
    const { rerender } = await render(
      <WorkCard
        variant="agenda"
        locationColor="sage"
        time="19:00"
        kind="Plantão · 12h"
        place="Hospital São Lucas"
        value="R$ 1.200"
        payment={{ state: 'scheduled', label: 'Recebe 12 OUT' }}
        onPress={() => {}}
        testID="work"
      />,
    );
    expect(screen.queryByText('Recebido')).toBeNull();
    await rerender(
      <WorkCard
        variant="agenda"
        locationColor="sage"
        time="19:00"
        kind="Plantão · 12h"
        place="Hospital São Lucas"
        value="R$ 1.200"
        payment={{ state: 'received', label: 'Recebido' }}
        onPress={() => {}}
        testID="work"
      />,
    );
    expect(screen.getByText('Recebido')).toHaveStyle({ color: colors.textSecondary });
    expect(
      StyleSheet.flatten(screen.getByTestId('work-status').props.style).backgroundColor,
    ).toBeUndefined();
  });

  it('does not invent an hour when an appointment has only a date', async () => {
    await render(
      <WorkCard
        variant="agenda"
        locationColor="terra"
        kind="Atendimento"
        place="Consultório"
        value="R$ 1.600"
        payment={{ state: 'undated', label: 'Entrada a definir' }}
        onPress={() => {}}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Atendimento, Consultório, R$ 1.600, Entrada a definir' }),
    ).toBeTruthy();
    expect(screen.queryByText(/--:--|00:00|R\$ 0/)).toBeNull();
  });

  it('Home featured card keeps the temporal relationship, time and forecast together', async () => {
    const onPress = jest.fn();
    await render(
      <WorkCard
        variant="featured"
        eyebrow="PRÓXIMO TRABALHO"
        temporalLabel="AMANHÃ"
        time="08:00"
        kind="Consultas · 6h"
        place="Clínica Central"
        value="R$ 850"
        paymentLabel="Previsto para entrar · 12 NOV"
        onPress={onPress}
        testID="featured"
      />,
    );
    expect(screen.getByTestId('featured')).toHaveStyle({
      paddingTop: workCardMetrics.featuredPaddingTop,
      paddingBottom: workCardMetrics.featuredPaddingBottom,
    });
    expect(screen.getByText('AMANHÃ')).toBeTruthy();
    expect(screen.getByText('Previsto para entrar · 12 NOV')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /PRÓXIMO TRABALHO/ }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('Home list row shows date, location, time and value with the validated color token', async () => {
    await render(
      <WorkCard
        variant="row"
        locationColor="bronze"
        day="14"
        month="SET"
        time="08:00"
        duration="6h"
        kind="Plantão"
        place="Clínica Central"
        value="R$ 850"
        onPress={() => {}}
        testID="work-row"
      />,
    );
    expect(screen.getByTestId('work-row')).toHaveStyle({ borderRadius: workCardMetrics.rowRadius });
    expect(screen.getByTestId('work-row-color')).toHaveStyle({
      backgroundColor: workLocationColors.bronze,
    });
    expect(screen.getByText('08:00 · 6h')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Plantão/ })).toBeTruthy();
  });

  it('catalog demonstrates every documented placement in development', async () => {
    await render(<PrimitivesCatalog />);
    for (const id of [
      'catalog-work-agenda',
      'catalog-work-agenda-second',
      'catalog-work-received',
      'catalog-work-featured',
      'catalog-work-row',
    ]) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
  });
});
