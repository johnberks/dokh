import '@/i18n';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { colors, emptyStateMetrics } from '@/theme/tokens';
import { EmptyState } from './EmptyState';
import { PrimitivesCatalog } from './PrimitivesCatalog';

describe('EmptyState visual placements', () => {
  it('Home month with no dated entries has dark typography and no fake zero', async () => {
    const onPrimaryPress = jest.fn();
    await render(
      <EmptyState variant="homeEntries" onPrimaryPress={onPrimaryPress} testID="home-entries" />,
    );
    expect(screen.getByText('Nenhuma entrada prevista ainda.')).toHaveStyle({
      color: colors.darkTextPrimary,
      fontSize: 26,
    });
    expect(screen.queryByText(/R\$ 0|0%/)).toBeNull();
    expect(screen.getByTestId('home-entries-action').props.hitSlop).toBe(13);
    await fireEvent.press(screen.getByTestId('home-entries-action'));
    expect(onPrimaryPress).toHaveBeenCalledTimes(1);
  });

  it('Home no-work card remains one accessible action, preserving financial context outside it', async () => {
    const onPrimaryPress = jest.fn();
    await render(
      <EmptyState variant="homeWork" onPrimaryPress={onPrimaryPress} testID="home-work" />,
    );
    const card = screen.getByRole('button', { name: /Nenhum trabalho adicionado ainda/ });
    expect(card).toHaveStyle({ borderRadius: emptyStateMetrics.cardRadius, paddingBottom: 24 });
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await fireEvent.press(card);
    expect(onPrimaryPress).toHaveBeenCalledTimes(1);
  });

  it('Agenda free day is a dashed panel, not an empty work card', async () => {
    const onPrimaryPress = jest.fn();
    await render(
      <EmptyState variant="agendaDay" onPrimaryPress={onPrimaryPress} testID="agenda" />,
    );
    expect(screen.getByTestId('agenda')).toHaveStyle({
      borderStyle: 'dashed',
      borderRadius: emptyStateMetrics.cardRadius,
      paddingVertical: 26,
    });
    expect(screen.getByText('Seu dia está livre.')).toBeTruthy();
    expect(screen.queryByText(/R\$/)).toBeNull();
    expect(screen.getByTestId('agenda-action').props.hitSlop).toBe(2);
    await fireEvent.press(screen.getByTestId('agenda-action'));
    expect(onPrimaryPress).toHaveBeenCalledTimes(1);
  });

  it('Finanças with no work shows the three preview topics, without invented amounts', async () => {
    await render(<EmptyState variant="financesNoWork" onPrimaryPress={() => {}} />);
    expect(screen.getByText('Seu mês começa por aqui.')).toHaveStyle({ fontSize: 30 });
    expect(screen.getByText('Quanto você tem para receber')).toBeTruthy();
    expect(screen.getByText('Quanto já entrou e quanto falta')).toBeTruthy();
    expect(screen.getByText('Quanto seu trabalho gerou')).toBeTruthy();
    expect(screen.queryByText(/R\$ 0|0%/)).toBeNull();
  });

  it('empty Entradas month is typographic and keeps the caller supplied period', async () => {
    await render(
      <EmptyState variant="entriesMonth" periodLabel="DEZEMBRO 2026" testID="entries" />,
    );
    expect(screen.getByTestId('entries')).toHaveStyle({
      paddingHorizontal: emptyStateMetrics.entriesHorizontalInset,
    });
    expect(screen.getByText('DEZEMBRO 2026')).toBeTruthy();
    expect(screen.getByText('Nada previsto por enquanto.')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('no next entry retains statement access regardless of reason', async () => {
    const onPrimaryPress = jest.fn();
    await render(
      <EmptyState
        variant="financesNextEntry"
        description="Todas as entradas já foram recebidas."
        onPrimaryPress={onPrimaryPress}
        testID="next-entry"
      />,
    );
    expect(screen.getByTestId('next-entry')).toHaveStyle({ borderStyle: 'dashed' });
    expect(screen.getByText('Nenhuma prevista')).toBeTruthy();
    expect(screen.getByText('Todas as entradas já foram recebidas.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Ver extrato do mês' }));
    expect(onPrimaryPress).toHaveBeenCalledTimes(1);
  });

  it('profile location and residency states have their distinct copy and 56-point actions', async () => {
    const onPrimaryPress = jest.fn();
    const { rerender } = await render(
      <EmptyState variant="profileLocations" onPrimaryPress={onPrimaryPress} testID="profile" />,
    );
    expect(screen.getByText('Onde você trabalha?')).toBeTruthy();
    expect(screen.getByTestId('profile-action')).toHaveStyle({ minHeight: 56 });
    await rerender(
      <EmptyState variant="profileResidency" onPrimaryPress={onPrimaryPress} testID="profile" />,
    );
    expect(screen.getByText('Você está em residência?')).toBeTruthy();
    expect(screen.getByText('Não faz residência? Nada muda para você.')).toBeTruthy();
    expect(screen.queryByText('Onde você trabalha?')).toBeNull();
  });

  it('parsed empty import differs from load failure and has independent actions', async () => {
    const onPrimaryPress = jest.fn();
    const onSecondaryPress = jest.fn();
    await render(
      <EmptyState
        variant="profileImportNoData"
        onPrimaryPress={onPrimaryPress}
        onSecondaryPress={onSecondaryPress}
        testID="import-empty"
      />,
    );
    expect(screen.getByText('ARQUIVO LIDO · 0 PLANTÕES')).toBeTruthy();
    expect(screen.getByText('Não encontramos plantões neste arquivo.')).toBeTruthy();
    expect(screen.queryByText('Não foi possível carregar')).toBeNull();
    await fireEvent.press(screen.getByTestId('import-empty-action'));
    await fireEvent.press(screen.getByTestId('import-empty-secondary'));
    expect(onPrimaryPress).toHaveBeenCalledTimes(1);
    expect(onSecondaryPress).toHaveBeenCalledTimes(1);
  });

  it('catalog demonstrates every design placement for inspection', async () => {
    await render(<PrimitivesCatalog />);
    for (const id of [
      'catalog-empty-home-entries',
      'catalog-empty-home-work',
      'catalog-empty-agenda',
      'catalog-empty-finances',
      'catalog-empty-entries',
      'catalog-empty-next-entry',
      'catalog-empty-locations',
      'catalog-empty-residency',
      'catalog-empty-import',
    ]) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
  });
});
