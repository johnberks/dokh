import Check from 'lucide-react-native/icons/check';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { WORK_TYPES, type WorkType } from '@/domain/work-type';
import { colors, workTypeSelectorMetrics as m, palette, shadow } from '@/theme/tokens';
import { AppText } from './AppText';
import { WorkTypeIcon, workTypeTone } from './WorkTypeIcon';

type CommonProps = {
  /** Nome do grupo para leitor de tela; a pergunta visível pertence à tela. */
  label: string;
  disabled?: boolean;
  testID?: string;
};

/** Onboarding 06: escolha única que permanece marcada; o CTA da tela avança. */
export type WorkTypeChoiceProps = CommonProps & {
  variant: 'choice';
  value: WorkType | null;
  onChange: (type: WorkType) => void;
};

/** Agenda 06B: menu de ação; tocar em um tipo segue direto para o formulário. */
export type WorkTypeMenuProps = CommonProps & {
  variant: 'menu';
  onSelect: (type: WorkType) => void;
};

export type WorkTypeSelectorProps = WorkTypeChoiceProps | WorkTypeMenuProps;

/**
 * Plantão, Procedimento e Atendimento com a área inteira clicável.
 * A seleção é anunciada (radio `checked`) e marcada por borda, check e texto — nunca só por cor.
 * Residência nunca aparece aqui.
 */
export function WorkTypeSelector(props: WorkTypeSelectorProps) {
  const { t } = useTranslation('components');
  const { variant, label, disabled = false, testID } = props;
  const isChoice = variant === 'choice';

  return (
    <View
      accessibilityRole={isChoice ? 'radiogroup' : 'list'}
      accessibilityLabel={label}
      testID={testID}
      style={styles.list}
    >
      {WORK_TYPES.map((type) => {
        const selected = isChoice && props.value === type;
        const title = t(`workType.${type}.title`);
        const description = t(`workType.${type}.${variant}`);
        return (
          <Pressable
            key={type}
            accessibilityRole={isChoice ? 'radio' : 'button'}
            accessibilityLabel={title}
            accessibilityHint={description}
            accessibilityState={isChoice ? { checked: selected, disabled } : { disabled }}
            disabled={disabled}
            onPress={() => (isChoice ? props.onChange(type) : props.onSelect(type))}
            testID={testID ? `${testID}-${type}` : undefined}
            style={({ pressed }) => [
              styles.option,
              isChoice ? (selected ? styles.choiceSelected : styles.choiceIdle) : styles.menuItem,
              pressed && !disabled && styles.pressed,
              disabled && styles.disabled,
            ]}
          >
            <View style={[styles.iconTile, { backgroundColor: workTypeTone[type].tile }]}>
              <WorkTypeIcon type={type} />
            </View>
            <View style={styles.texts}>
              <AppText
                variant="heading1"
                style={[styles.title, isChoice ? styles.choiceTitle : styles.menuTitle]}
              >
                {title}
              </AppText>
              <AppText style={styles.description}>{description}</AppText>
            </View>
            {isChoice ? (
              <View
                accessible={false}
                testID={testID ? `${testID}-${type}-indicator` : undefined}
                style={selected ? styles.radioSelected : styles.radioIdle}
              >
                {selected && <Check color={palette.base} size={12} strokeWidth={2.5} />}
              </View>
            ) : (
              <ChevronRight color={palette.sage} size={16} strokeWidth={1.7} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: m.listGap },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.gap,
    minHeight: 44,
    borderRadius: m.radius,
    paddingVertical: m.paddingVertical,
    paddingHorizontal: m.paddingHorizontal,
  },
  // Selecionado: borda de 1,5 em verde escuro e superfície papel (Onboarding 06).
  choiceSelected: {
    borderWidth: m.selectedBorderWidth,
    borderColor: colors.foreground,
    backgroundColor: colors.surface,
    ...shadow.raised,
  },
  // Não selecionado: sem preenchimento e borda de 1; o padding compensa os 0,5 da borda
  // selecionada para o conteúdo não se deslocar ao trocar a escolha.
  choiceIdle: {
    borderWidth: 1,
    borderColor: colors.workTypeBorder,
    paddingVertical: m.paddingVertical + (m.selectedBorderWidth - 1),
    paddingHorizontal: m.paddingHorizontal + (m.selectedBorderWidth - 1),
  },
  menuItem: {
    borderWidth: 1,
    borderColor: colors.workTypeBorder,
    backgroundColor: colors.surface,
    ...shadow.subtle,
  },
  pressed: { transform: [{ translateY: 1 }] },
  disabled: { opacity: 0.45 },
  iconTile: {
    width: m.iconTile,
    height: m.iconTile,
    borderRadius: m.iconTileRadius,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  texts: { flex: 1, gap: 2 },
  title: { color: colors.textPrimary },
  choiceTitle: {
    fontSize: m.choiceTitleSize,
    lineHeight: 22,
    letterSpacing: -0.17,
  },
  menuTitle: {
    fontSize: m.menuTitleSize,
    lineHeight: 21,
    letterSpacing: -0.16,
  },
  description: {
    fontSize: m.descriptionSize,
    lineHeight: m.descriptionLineHeight,
    color: colors.textMuted,
  },
  radioSelected: {
    width: m.radio,
    height: m.radio,
    borderRadius: m.radio / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioIdle: {
    width: m.radio,
    height: m.radio,
    borderRadius: m.radio / 2,
    borderWidth: m.radioBorderWidth,
    borderColor: colors.workTypeRadioBorder,
    flexShrink: 0,
  },
});
