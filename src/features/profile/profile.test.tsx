import '@/i18n';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as Heroicons from '@/components/icons/heroicons';
import {
  archiveWorkLocation,
  createWorkLocation,
  updateWorkLocation,
} from '@/features/locations/locations-data';
import { renderWithProviders } from '@/test/render';
import { EditProfileScreen, parseGraduationYear } from './EditProfileScreen';
import { LocationFormScreen, LocationsScreen } from './LocationsScreens';
import { PROFILE_ICONS, ProfileIcon } from './ProfilePieces';
import { ProfileScreen } from './ProfileScreen';
import { initialsOf } from './profile-data';
import { ResidencyFormScreen, ResidencyScreen } from './ResidencyScreens';
import { AccountScreen, AppearanceScreen, HelpScreen, PreferencesScreen } from './SettingsScreens';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useFocusEffect: (effect: () => undefined) => jest.requireActual('react').useEffect(effect, []),
}));
const mockSignOut = jest.fn(async () => {});
jest.mock('@/features/auth/AuthSessionProvider', () => ({
  AuthSessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthSession: () => ({ status: 'signedIn', userId: 'user-1', signOut: mockSignOut }),
}));
let mockPremium = false;

jest.mock('@/features/billing/entitlement', () => ({
  usePremium: () => ({ isSuccess: true, data: mockPremium }),
}));

type Query = { isPending: boolean; isError: boolean; isSuccess: boolean; data?: unknown };
const ok = (data: unknown): Query => ({ isPending: false, isError: false, isSuccess: true, data });
let mockLocations: unknown[] = [];
jest.mock('@/features/locations/locations-data', () => ({
  ...jest.requireActual('@/features/locations/locations-data'),
  useWorkLocations: () => ({ ...ok(mockLocations), refetch: jest.fn(), isFetching: false }),
  createWorkLocation: jest.fn(async () => ({})),
  updateWorkLocation: jest.fn(async () => ({})),
  archiveWorkLocation: jest.fn(async () => {}),
}));

const annaProfile = {
  displayName: 'Anna Cunha',
  graduationYear: 2024,
  status: 'resident',
  specialty: 'Clínica Médica',
  city: 'São Paulo, SP',
  avatarPath: null,
  avatarUrl: null,
};
const residency = {
  id: 'res-1',
  specialty: 'Clínica Médica',
  institution: 'Hospital São Lucas',
  levelLabel: 'R2',
  startsOn: '2025-03-01',
  expectedEndsOn: '2027-02-01',
  monthlyAmountCents: 410609n,
  paymentDay: 5,
};
let mockProfile: unknown = annaProfile;
let mockResidency: unknown = residency;
let mockPreferences: unknown = { durationMinutes: 720, startTime: '19:00', paymentTermDays: 30 };
const mockUpdate = jest.fn();
const mockSaveResidency = jest.fn();
const mockEndResidency = jest.fn();
const mockSavePreferences = jest.fn();
const mutation = (fn: jest.Mock) => ({
  mutate: (input: unknown, options?: { onSuccess?: () => void }) => {
    fn(input);
    options?.onSuccess?.();
  },
  isPending: false,
  isError: false,
});
jest.mock('./profile-data', () => ({
  ...jest.requireActual('./profile-data'),
  useProfile: () => ({ ...ok(mockProfile), refetch: jest.fn(), isFetching: false }),
  useActiveResidency: () => ({ ...ok(mockResidency), refetch: jest.fn(), isFetching: false }),
  useWorkPreferences: () => ({ ...ok(mockPreferences), refetch: jest.fn(), isFetching: false }),
  useLocationWorkCounts: () => ok({ 'loc-1': 12, 'loc-2': 1 }),
  useAccountEmail: () => ok('anna@example.com'),
  useUpdateProfile: () => mutation(mockUpdate),
  useReplaceAvatar: () => mutation(jest.fn()),
  useRemoveAvatar: () => mutation(jest.fn()),
  useSaveResidency: () => mutation(mockSaveResidency),
  useEndResidency: () => mutation(mockEndResidency),
  useSaveWorkPreferences: () => mutation(mockSavePreferences),
}));

const hospital = {
  id: 'loc-1',
  name: 'Hospital São Lucas',
  city: null,
  colorToken: 'sage',
  colorSource: 'automatic',
  archivedAt: null,
};
const clinic = { ...hospital, id: 'loc-2', name: 'Clínica Central', colorToken: 'bronze' };

beforeEach(() => {
  jest.clearAllMocks();
  mockPremium = false;
  mockLocations = [hospital, clinic];
  mockProfile = annaProfile;
  mockResidency = residency;
  mockPreferences = { durationMinutes: 720, startTime: '19:00', paymentTermDays: 30 };
});

async function press(testID: string) {
  await act(async () => {
    await fireEvent.press(screen.getByTestId(testID));
  });
}

describe('Perfil principal (01/18)', () => {
  it('Free: identidade, card Premium sem compra e grupos de configuração', async () => {
    await renderWithProviders(<ProfileScreen />);
    expect(screen.getByRole('header', { name: 'Anna Cunha' })).toBeTruthy();
    // Situação, turma e cidade como tags no card do topo; nada de contagens inventadas.
    expect(screen.getByText('Residente de Clínica Médica')).toBeTruthy();
    expect(screen.getByText('Turma de 2024')).toBeTruthy();
    expect(screen.getByText('São Paulo, SP')).toBeTruthy();
    expect(screen.queryByText(/trabalhos em/)).toBeNull();
    expect(screen.getByTestId('profile-avatar-initials')).toBeTruthy();
    expect(screen.getByText('AC')).toBeTruthy();
    expect(screen.getByTestId('profile-premium-card')).toBeTruthy();
    expect(screen.queryByTestId('profile-premium-active')).toBeNull();
    expect(screen.getByTestId('profile-row-locations').props.accessibilityLabel).toBe(
      'Locais de trabalho, 2',
    );
    expect(screen.getByTestId('profile-row-residency').props.accessibilityLabel).toBe(
      'Residência, Clínica Médica',
    );
    await press('profile-row-locations');
    expect(router.push).toHaveBeenCalledWith('/profile/locations');
    await press('profile-edit');
    expect(router.push).toHaveBeenCalledWith('/profile/edit');
    // Sem destino configurado, avaliar, ajuda e termos não aparecem (nada de "em breve").
    expect(screen.queryByTestId('profile-row-rate')).toBeNull();
    expect(screen.queryByTestId('profile-row-help')).toBeNull();
    expect(screen.queryByTestId('profile-terms')).toBeNull();
    await press('profile-sign-out');
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('Premium ativo: linha compacta, sem card de venda', async () => {
    mockPremium = true;
    await renderWithProviders(<ProfileScreen />);
    expect(screen.getByTestId('profile-premium-active')).toBeTruthy();
    expect(screen.queryByTestId('profile-premium-card')).toBeNull();
    expect(screen.getByText('Gerenciar assinatura')).toBeTruthy();
  });

  it('iniciais usam o primeiro e o último nome', () => {
    expect(initialsOf('Anna Beatriz Cunha')).toBe('AC');
    expect(initialsOf('joão')).toBe('J');
  });
});

/** Situação profissional fica num dropdown: abre o menu e escolhe a opção. */
async function chooseStatus(value: string) {
  await press('profile-edit-status');
  await press(`profile-edit-status-${value}`);
}

describe('Editar perfil (02)', () => {
  it('situação profissional em dropdown com descrição e check na opção atual', async () => {
    await renderWithProviders(<EditProfileScreen />);
    const field = screen.getByTestId('profile-edit-status');
    expect(field.props.accessibilityValue).toEqual({ text: 'Em residência' });
    expect(screen.queryByTestId('profile-edit-status-menu')).toBeNull();

    await press('profile-edit-status');
    expect(screen.getByTestId('profile-edit-status-menu')).toBeTruthy();
    expect(screen.getByText('Já concluí minha especialização.')).toBeTruthy();
    expect(
      screen.getByTestId('profile-edit-status-resident').props.accessibilityState,
    ).toMatchObject({ selected: true });

    await press('profile-edit-status-specialist');
    expect(screen.getByTestId('profile-edit-status').props.accessibilityValue).toEqual({
      text: 'Especialista',
    });
  });

  it('ano de graduação vazio ou plausível', () => {
    expect(parseGraduationYear('', 2026)).toBeNull();
    expect(parseGraduationYear('2024', 2026)).toBe(2024);
    expect(parseGraduationYear('2030', 2026)).toBe('invalid');
    expect(parseGraduationYear('24', 2026)).toBe('invalid');
  });

  it('três situações: residente e especialista pedem especialidade, generalista não', async () => {
    mockProfile = { ...annaProfile, status: 'general_practitioner', specialty: null };
    mockResidency = null;
    await renderWithProviders(<EditProfileScreen />);
    expect(screen.getByText('Generalista')).toBeTruthy();
    await press('profile-edit-status');
    expect(screen.getByText('Em residência')).toBeTruthy();
    expect(screen.getByText('Especialista')).toBeTruthy();
    // Toque fora fecha sem mudar a escolha.
    await press('profile-edit-status-backdrop');
    await waitFor(() => expect(screen.queryByTestId('profile-edit-status-menu')).toBeNull());
    expect(screen.queryByTestId('profile-edit-specialty')).toBeNull();

    await chooseStatus('resident');
    expect(screen.getByText('Especialidade ou programa da residência')).toBeTruthy();
    await chooseStatus('specialist');
    expect(screen.getByText('Especialidade')).toBeTruthy();
    // Especialista sem especialidade não salva.
    expect(screen.getByTestId('profile-edit-save').props.accessibilityState).toMatchObject({
      disabled: true,
    });
    // Mesma lista de especialidades do onboarding.
    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('profile-edit-specialty'), 'cardio');
    });
    await press('profile-edit-specialty-option-Cardiologia');
    expect(screen.queryByTestId('profile-edit-specialty-suggestions')).toBeNull();
    await press('profile-edit-save');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'specialist', specialty: 'Cardiologia' }),
    );
    expect(router.back).toHaveBeenCalled();
  });

  it('residente com bolsa: dados da residência à mão e sair da residência pede confirmação', async () => {
    await renderWithProviders(<EditProfileScreen />);
    expect(screen.getByTestId('profile-edit-specialty')).toBeTruthy();
    await press('profile-edit-residency-data');
    expect(router.push).toHaveBeenCalledWith('/profile/residency');

    await chooseStatus('general_practitioner');
    expect(screen.queryByTestId('profile-edit-specialty')).toBeNull();
    expect(screen.queryByTestId('profile-edit-residency-data')).toBeNull();
    await press('profile-edit-save');
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(screen.getByText('Sair da residência?')).toBeTruthy();
    await press('profile-edit-leave-confirm');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: 'Anna Cunha', status: 'general_practitioner' }),
    );
    expect(router.back).toHaveBeenCalled();
  });

  it('residente sem bolsa troca de situação sem confirmação', async () => {
    mockResidency = null;
    await renderWithProviders(<EditProfileScreen />);
    await chooseStatus('general_practitioner');
    await press('profile-edit-save');
    expect(screen.queryByText('Sair da residência?')).toBeNull();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'general_practitioner' }),
    );
  });

  it('nome vazio bloqueia salvar', async () => {
    await renderWithProviders(<EditProfileScreen />);
    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('profile-edit-name'), '  ');
    });
    expect(screen.getByTestId('profile-edit-save').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });
});

describe('Locais (03/04)', () => {
  it('lista com contagem e sem valores; vazio tipográfico', async () => {
    await renderWithProviders(<LocationsScreen />);
    expect(screen.getByText('12 trabalhos registrados')).toBeTruthy();
    expect(screen.getByText('1 trabalho registrado')).toBeTruthy();
    expect(screen.queryByText(/R\$/)).toBeNull();
    await press('location-loc-1');
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/profile/locations/[id]',
      params: { id: 'loc-1' },
    });
  });

  it('sem locais mostra o vazio com o primeiro local', async () => {
    mockLocations = [];
    await renderWithProviders(<LocationsScreen />);
    expect(screen.getByText('Onde você trabalha?')).toBeTruthy();
  });

  it('novo local: nome obrigatório, nome repetido bloqueia e Free não usa a paleta ampliada', async () => {
    await renderWithProviders(<LocationFormScreen />);
    expect(screen.getByTestId('location-save').props.accessibilityState).toMatchObject({
      disabled: true,
    });
    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('location-name'), 'hospital são lucas');
    });
    expect(screen.getByTestId('location-duplicate')).toBeTruthy();
    expect(screen.getByTestId('location-color-petrol').props.accessibilityState).toMatchObject({
      disabled: true,
    });
    expect(screen.getByText('PREMIUM')).toBeTruthy();

    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('location-name'), 'UBS Centro');
    });
    await press('location-color-blue');
    await press('location-save');
    await waitFor(() => expect(createWorkLocation).toHaveBeenCalled());
    expect(jest.mocked(createWorkLocation).mock.calls[0][0]).toMatchObject({
      name: 'UBS Centro',
      colorToken: 'blue',
      colorSource: 'free_palette',
    });
  });

  it('Premium escolhe a paleta ampliada sem selo; editar e remover com confirmação', async () => {
    mockPremium = true;
    await renderWithProviders(<LocationFormScreen locationId="loc-1" />);
    expect(screen.queryByText('PREMIUM')).toBeNull();
    await press('location-color-petrol');
    await press('location-save');
    await waitFor(() => expect(updateWorkLocation).toHaveBeenCalled());
    expect(jest.mocked(updateWorkLocation).mock.calls[0][1]).toMatchObject({
      colorToken: 'petrol',
      colorSource: 'premium_palette',
    });

    await press('location-remove');
    expect(screen.getByText('Remover Hospital São Lucas?')).toBeTruthy();
    expect(archiveWorkLocation).not.toHaveBeenCalled();
    await press('location-remove-confirm');
    await waitFor(() => expect(archiveWorkLocation).toHaveBeenCalledWith('loc-1'));
  });
});

describe('Residência (05)', () => {
  it('mostra a bolsa como configuração da fonte recorrente', async () => {
    await renderWithProviders(<ResidencyScreen />);
    expect(screen.getByText('Residência ativa')).toBeTruthy();
    expect(screen.getByText('R2')).toBeTruthy();
    expect(screen.getByText('Mar 2025')).toBeTruthy();
    expect(screen.getByText('Fev 2027')).toBeTruthy();
    expect(screen.getByText('Dia 05')).toBeTruthy();
  });

  it('residente sem bolsa: convite para completar os dados da residência', async () => {
    mockResidency = null;
    await renderWithProviders(<ResidencyScreen />);
    expect(screen.getByText('Complete os dados da sua residência.')).toBeTruthy();
    expect(screen.getByText('Você pode fazer isso depois, quando quiser.')).toBeTruthy();
  });

  it('quem não é residente não vê residência como pendência', async () => {
    mockProfile = { ...annaProfile, status: 'specialist', specialty: 'Cardiologia' };
    mockResidency = null;
    await renderWithProviders(<ResidencyScreen />);
    expect(screen.getByTestId('residency-not-resident')).toBeTruthy();
    expect(screen.queryByText('Complete os dados da sua residência.')).toBeNull();
  });

  it('edição grava pela RPC e encerrar pede confirmação', async () => {
    await renderWithProviders(<ResidencyFormScreen />);
    await press('residency-day');
    await press('residency-day-10');
    await press('residency-day-confirm');
    await press('residency-save');
    expect(mockSaveResidency).toHaveBeenCalledWith({
      id: 'res-1',
      input: expect.objectContaining({
        specialty: 'Clínica Médica',
        paymentDay: 10,
        monthlyAmountCents: 410609n,
        startsOn: '2025-03-01',
      }),
    });

    await press('residency-end');
    expect(screen.getByText('Encerrar residência?')).toBeTruthy();
    await press('residency-end-confirm');
    expect(mockEndResidency).toHaveBeenCalledWith('res-1');
  });
});

describe('Preferências, aparência, conta e ajuda (06/15/16/17)', () => {
  it('preferências gravam duração, horário e prazo', async () => {
    await renderWithProviders(<PreferencesScreen />);
    await press('preferences-duration-24');
    await press('preferences-term-60');
    await press('preferences-save');
    expect(mockSavePreferences).toHaveBeenCalledWith({
      durationMinutes: 1440,
      startTime: '19:00',
      paymentTermDays: 60,
    });
  });

  it('aparência: só o claro existe; sistema e escuro em breve', async () => {
    await renderWithProviders(<AppearanceScreen />);
    expect(screen.getByTestId('appearance-light').props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(screen.getByTestId('appearance-dark').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it('conta: e-mail e plano Free; sair fica na tela principal', async () => {
    await renderWithProviders(<AccountScreen />);
    expect(screen.getByText('anna@example.com')).toBeTruthy();
    expect(screen.getByText('Free')).toBeTruthy();
    expect(screen.queryByTestId('account-sign-out')).toBeNull();
    await press('account-delete');
    expect(screen.getByText(/ainda não está disponível/)).toBeTruthy();
  });

  it('ajuda: destinos sem definição não aparecem', async () => {
    await renderWithProviders(<HelpScreen />);
    expect(screen.queryByTestId('help-helpCenter')).toBeNull();
    expect(screen.queryByText('EM BREVE')).toBeNull();
    expect(screen.getByText('Ajude a construir a DOKH.')).toBeTruthy();
  });
});

describe('card do topo (referência Lyft)', () => {
  it('Generalista sem turma e sem cidade mostra só a tag da situação', async () => {
    mockProfile = {
      ...annaProfile,
      status: 'general_practitioner',
      specialty: null,
      graduationYear: null,
      city: null,
    };
    await renderWithProviders(<ProfileScreen />);
    expect(screen.getByText('Generalista')).toBeTruthy();
    expect(screen.queryByText(/Turma de/)).toBeNull();
    expect(screen.getByTestId('profile-tags').props.children.filter(Boolean)).toHaveLength(1);
    // Sem residência é estado válido: nada de linha Residência como pendência.
    expect(screen.queryByTestId('profile-row-residency')).toBeNull();
  });

  it('nome longo na tag quebra em até duas linhas em vez de estourar o card', async () => {
    mockProfile = {
      ...annaProfile,
      status: 'specialist',
      specialty: 'Traumatologia Bucomaxilofacial',
    };
    mockResidency = null;
    await renderWithProviders(<ProfileScreen />);
    const tag = screen.getByText('Especialista em Traumatologia Bucomaxilofacial');
    expect(tag.props.numberOfLines).toBe(2);
    expect(tag).toHaveStyle({ textAlign: 'center' });
  });

  it('Especialista mostra "Especialista em X" e não mostra Residência', async () => {
    mockProfile = { ...annaProfile, status: 'specialist', specialty: 'Cardiologia' };
    mockResidency = null;
    await renderWithProviders(<ProfileScreen />);
    expect(screen.getByText('Especialista em Cardiologia')).toBeTruthy();
    expect(screen.queryByTestId('profile-row-residency')).toBeNull();
  });
});

describe('ícones do Perfil', () => {
  it('usam o conjunto Heroicons Solid', async () => {
    for (const name of Object.keys(PROFILE_ICONS) as (keyof typeof PROFILE_ICONS)[]) {
      const { unmount } = await renderWithProviders(<ProfileIcon name={name} />);
      await unmount();
    }
    expect(PROFILE_ICONS.pin).toBe(Heroicons.MapPinIcon);
    expect(PROFILE_ICONS.logout).toBe(Heroicons.ArrowRightStartOnRectangleIcon);
  });
});
