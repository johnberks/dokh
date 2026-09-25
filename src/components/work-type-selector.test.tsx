import '@/i18n';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { colors, workTypeSelectorMetrics } from '@/theme/tokens';
import { PrimitivesCatalog } from './PrimitivesCatalog';
import { WorkTypeSelector } from './WorkTypeSelector';

function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

describe('WorkTypeSelector — escolha (Onboarding 06)', () => {
  it('lista só Plantão, Procedimento e Atendimento como rádios, sem Residência', async () => {
    await render(
      <WorkTypeSelector
        variant="choice"
        label="O que você quer registrar?"
        value={null}
        onChange={jest.fn()}
      />,
    );
    // O grupo não é `accessible` (senão o VoiceOver fundiria as opções); ele só nomeia o conjunto.
    expect(screen.getByLabelText('O que você quer registrar?').props.accessibilityRole).toBe(
      'radiogroup',
    );
    const radios = screen.getAllByRole('radio');
    expect(radios.map((radio) => radio.props.accessibilityLabel)).toEqual([
      'Plantão',
      'Procedimento',
      'Atendimento',
    ]);
    expect(screen.queryByText(/Residência/)).toBeNull();
    for (const radio of radios) {
      expect(radio.props.accessibilityState).toMatchObject({ checked: false });
    }
    expect(
      screen.getByText('Turnos e períodos de trabalho em hospitais ou serviços.'),
    ).toBeTruthy();
  });

  it('anuncia a seleção e marca por borda e check, não só por cor', async () => {
    await render(
      <WorkTypeSelector
        variant="choice"
        label="Tipo"
        value="procedure"
        onChange={jest.fn()}
        testID="type"
      />,
    );
    const procedure = screen.getByRole('radio', { name: 'Procedimento' });
    expect(procedure.props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByRole('radio', { name: 'Plantão' }).props.accessibilityState).toMatchObject({
      checked: false,
    });
    expect(procedure).toHaveStyle({
      borderWidth: workTypeSelectorMetrics.selectedBorderWidth,
      borderColor: colors.foreground,
      backgroundColor: colors.surface,
    });
    expect(screen.getByTestId('type-procedure-indicator')).toHaveStyle({
      backgroundColor: colors.accent,
    });
    expect(screen.getByTestId('type-shift-indicator')).toHaveStyle({
      borderColor: colors.workTypeRadioBorder,
    });
  });

  it('a área inteira da opção é clicável e devolve o tipo tipado', async () => {
    const onChange = jest.fn();
    await render(
      <WorkTypeSelector variant="choice" label="Tipo" value={null} onChange={onChange} />,
    );
    await fireEvent.press(screen.getByRole('radio', { name: 'Atendimento' }));
    expect(onChange).toHaveBeenCalledWith('appointment');
    expect(screen.getByRole('radio', { name: 'Atendimento' })).toHaveStyle({ minHeight: 44 });
  });

  it('não dispara quando desabilitado', async () => {
    const onChange = jest.fn();
    await render(
      <WorkTypeSelector variant="choice" label="Tipo" value={null} onChange={onChange} disabled />,
    );
    await fireEvent.press(screen.getByRole('radio', { name: 'Plantão' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Plantão' }).props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });
});

describe('WorkTypeSelector — menu (Agenda 06B)', () => {
  it('usa botões com a copy da Agenda e segue direto com o tipo tocado', async () => {
    const onSelect = jest.fn();
    await render(
      <WorkTypeSelector variant="menu" label="O que você quer adicionar?" onSelect={onSelect} />,
    );
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.props.accessibilityLabel)).toEqual([
      'Plantão',
      'Procedimento',
      'Atendimento',
    ]);
    expect(screen.getByText('Registre um turno ou período de trabalho.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Procedimento' }));
    expect(onSelect).toHaveBeenCalledWith('procedure');
  });
});

describe('WorkTypeSelector — acessibilidade visual', () => {
  it('título e descrição têm contraste AA sobre o fundo e a superfície', () => {
    for (const background of [colors.background, colors.surface]) {
      expect(contrastRatio(colors.textPrimary, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(colors.textMuted, background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('aparece no catálogo interno nas duas variações', async () => {
    await render(<PrimitivesCatalog />);
    expect(screen.getByTestId('catalog-work-type-choice')).toBeTruthy();
    expect(screen.getByTestId('catalog-work-type-menu')).toBeTruthy();
  });
});
