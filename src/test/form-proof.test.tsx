/**
 * Formulário de prova da tarefa 1.6: React Hook Form + Zod + mutation do TanStack Query.
 * Garante o contrato que todo formulário do app deve seguir (CLAUDE.md > Formulários):
 * valida por campo, submete o payload tipado e preserva o que foi digitado quando o servidor falha.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';
import { z } from 'zod';
import { renderWithProviders } from './render';

const schema = z.object({
  locationName: z.string().trim().min(1, 'required'),
});
type Payload = z.infer<typeof schema>;

function ProofForm({ save }: { save: (payload: Payload) => Promise<void> }) {
  const mutation = useMutation({ mutationFn: save });
  const { control, handleSubmit, formState } = useForm<Payload>({
    resolver: zodResolver(schema),
    defaultValues: { locationName: '' },
  });

  return (
    <View>
      <Controller
        control={control}
        name="locationName"
        render={({ field }) => (
          <TextInput
            accessibilityLabel="location"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      {formState.errors.locationName ? (
        <Text testID="field-error">{formState.errors.locationName.message}</Text>
      ) : null}
      {mutation.isError ? <Text testID="server-error">{String(mutation.error)}</Text> : null}
      {mutation.isSuccess ? <Text testID="saved">{'ok'}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="submit"
        disabled={mutation.isPending}
        onPress={handleSubmit((payload) => mutation.mutate(payload))}
      />
    </View>
  );
}

describe('formulário de prova (RHF + Zod + TanStack Query)', () => {
  it('bloqueia envio inválido e associa o erro ao campo', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    await renderWithProviders(<ProofForm save={save} />);

    await fireEvent.press(screen.getByLabelText('submit'));

    expect(await screen.findByTestId('field-error')).toHaveTextContent('required');
    expect(save).not.toHaveBeenCalled();
  });

  it('submete o payload validado e normalizado', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    await renderWithProviders(<ProofForm save={save} />);

    await fireEvent.changeText(screen.getByLabelText('location'), '  Hospital São Lucas  ');
    await fireEvent.press(screen.getByLabelText('submit'));

    await screen.findByTestId('saved');
    expect(save.mock.calls[0][0]).toEqual({ locationName: 'Hospital São Lucas' });
  });

  it('preserva o que foi digitado quando o servidor falha e permite nova tentativa', async () => {
    const save = jest
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(undefined);
    await renderWithProviders(<ProofForm save={save} />);

    await fireEvent.changeText(screen.getByLabelText('location'), 'Clínica Central');
    await fireEvent.press(screen.getByLabelText('submit'));

    expect(await screen.findByTestId('server-error')).toBeTruthy();
    expect(screen.getByLabelText('location').props.value).toBe('Clínica Central');
    // Mutations não têm retry automático.
    expect(save).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByLabelText('submit'));
    await screen.findByTestId('saved');
    expect(save).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.queryByTestId('server-error')).toBeNull());
  });
});
