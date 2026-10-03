import '@/i18n';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { PaymentSheet } from './form/PaymentSheet';
import { addDaysToLocalDate, todayInTimezone } from './work-schedule';

const today = todayInTimezone(deviceTimezone());
// Trabalho de quatro meses atrás: D30, D60 e D90 já passaram.
const pastWork = addDaysToLocalDate(today, -120);
const futureWork = addDaysToLocalDate(today, 10);

async function openSheet(workDate: string, onConfirm = jest.fn()) {
  await render(
    <PaymentSheet
      open
      workDate={workDate}
      value={null}
      onClose={jest.fn()}
      onConfirm={onConfirm}
    />,
  );
  return onConfirm;
}

describe('previsão no + para trabalho no passado (7.7)', () => {
  it('prazo vencido avisa "já passou" e pergunta se recebeu', async () => {
    await openSheet(pastWork);
    expect(screen.getByTestId('work-payment-30').props.accessibilityLabel).toMatch(/já passou/);
    expect(screen.getByTestId('work-received')).toBeTruthy();
  });

  it('"Já recebi" confirma com recebido; "Ainda não" mantém previsto', async () => {
    const onConfirm = await openSheet(pastWork);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-received-yes'));
    });
    expect(screen.getByTestId('work-payment-confirm').props.accessibilityLabel).toMatch(
      /Confirmar · recebido/,
    );
    await act(async () => {
      await fireEvent.press(screen.getByTestId('work-payment-confirm'));
    });
    expect(onConfirm).toHaveBeenCalledWith({
      kind: 'date',
      date: addDaysToLocalDate(pastWork, 30),
      received: true,
    });
  });

  it('trabalho futuro não oferece "Já recebi"', async () => {
    await openSheet(futureWork);
    expect(screen.queryByTestId('work-received')).toBeNull();
    expect(screen.getByTestId('work-payment-30').props.accessibilityLabel).not.toMatch(/já passou/);
  });
});
