import '@/i18n';
import { onlineManager } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { act } from 'react';
import { EmptyState } from './EmptyState';
import { Illustration, type IllustrationName } from './Illustration';
import { LoadError } from './TechnicalStates';

/** Decorativas: escondidas do leitor de tela, então a busca precisa incluí-las. */
const HIDDEN = { includeHiddenElements: true };

const NAMES: IllustrationName[] = [
  'emptyAgenda',
  'firstEntry',
  'emptyWallet',
  'nextShift',
  'emptyStatement',
  'allClear',
  'paymentPending',
  'offline',
  'error',
  'premium',
];

describe('Ilustrações (DOKH Ilustracoes V1)', () => {
  it('as dez existem em 4:3 e ficam fora do leitor de tela', async () => {
    for (const name of NAMES) {
      const { unmount } = await render(<Illustration name={name} width={120} />);
      const frame = screen.getByTestId(`illustration-${name}`, HIDDEN);
      expect(frame).toHaveStyle({ width: 120, height: 90 });
      expect(frame.props.accessibilityElementsHidden).toBe(true);
      await unmount();
    }
  });

  it('card da Home: primeira entrada sem trabalhos, próximo plantão depois', async () => {
    const { rerender } = await render(
      <EmptyState variant="homeWork" firstWork onPrimaryPress={jest.fn()} />,
    );
    expect(screen.getByTestId('illustration-firstEntry', HIDDEN)).toBeTruthy();
    await rerender(<EmptyState variant="homeWork" onPrimaryPress={jest.fn()} />);
    expect(screen.getByTestId('illustration-nextShift', HIDDEN)).toBeTruthy();
  });

  it('vazios de Agenda, Finanças e Extrato usam a ilustração de cada situação', async () => {
    const { rerender } = await render(
      <EmptyState variant="agendaDay" onPrimaryPress={jest.fn()} />,
    );
    expect(screen.getByTestId('illustration-emptyAgenda', HIDDEN)).toBeTruthy();
    await rerender(<EmptyState variant="financesNoWork" onPrimaryPress={jest.fn()} />);
    expect(screen.getByTestId('illustration-emptyWallet', HIDDEN)).toBeTruthy();
    await rerender(<EmptyState variant="entriesMonth" periodLabel="SETEMBRO 2026" />);
    expect(screen.getByTestId('illustration-emptyStatement', HIDDEN)).toBeTruthy();
    await rerender(<EmptyState variant="financesNextEntry" description="Nada previsto." />);
    expect(screen.getByTestId('illustration-allClear', HIDDEN)).toBeTruthy();
  });

  it('erro de leitura: "algo deu errado" online e "sem conexão" offline', async () => {
    await render(<LoadError onRetry={jest.fn()} />);
    expect(screen.getByTestId('illustration-error', HIDDEN)).toBeTruthy();
    expect(screen.getByText('Não foi possível carregar')).toBeTruthy();
    try {
      await act(async () => onlineManager.setOnline(false));
      expect(screen.getByTestId('illustration-offline', HIDDEN)).toBeTruthy();
      expect(screen.getByText('Sem conexão')).toBeTruthy();
    } finally {
      await act(async () => onlineManager.setOnline(true));
    }
  });
});
