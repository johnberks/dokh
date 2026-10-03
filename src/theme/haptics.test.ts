import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { haptic } from './haptics';

const notification = jest.mocked(Haptics.notificationAsync);
const android = jest.mocked(Haptics.performAndroidHapticsAsync);

beforeEach(() => jest.clearAllMocks());

describe('vibração (grupo 1)', () => {
  it('iPhone: sucesso e erro usam as vibrações de notificação do sistema', () => {
    haptic('success');
    haptic('error');
    expect(notification.mock.calls).toEqual([['success'], ['error']]);
    expect(android).not.toHaveBeenCalled();
  });

  it('Android: confirmar e recusar, sem precisar do vibrador', () => {
    const os = jest.replaceProperty(Platform, 'OS', 'android');
    haptic('success');
    haptic('error');
    expect(android.mock.calls).toEqual([['confirm'], ['reject']]);
    expect(notification).not.toHaveBeenCalled();
    os.restore();
  });

  it('sem o módulo nativo (build antigo), segue sem vibrar e sem quebrar', async () => {
    notification.mockRejectedValueOnce(new Error('Haptics is not available'));
    expect(() => haptic('success')).not.toThrow();
    notification.mockImplementationOnce(() => {
      throw new Error('missing');
    });
    expect(() => haptic('error')).not.toThrow();
    await Promise.resolve();
  });
});
