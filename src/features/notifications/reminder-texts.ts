import { i18n } from '@/i18n';
import type { ReminderTexts } from './reminder-plan';

/** Textos dos avisos em pt-BR (os avisos são montados fora de componentes). */
export function reminderTexts(): ReminderTexts {
  const t = i18n.getFixedT(null, 'notifications');
  const agenda = i18n.getFixedT(null, 'agenda');
  return {
    residency: t('reminder.residency'),
    receivableTitle: (amount, count) =>
      count === 1
        ? t('reminder.receivableTitleOne', { amount })
        : t('reminder.receivableTitleMany', { amount }),
    receivableBody: (origins) => t('reminder.receivableBody', { origins }),
    joinOrigins: (names) => {
      if (names.length <= 1) return names[0] ?? '';
      if (names.length === 2) return names.join(t('reminder.and'));
      return t('reminder.andMore', { first: names[0], count: names.length - 1 });
    },
    workTitle: (type, lead) => {
      const label = agenda(`workType.${type}` as 'workType.shift');
      if (lead === 'today') return t('reminder.workToday', { type: label });
      if (lead === 1440) return t('reminder.workTomorrow', { type: label });
      return t('reminder.workIn', {
        type: label,
        lead: t(`reminder.leadText.min${lead}` as 'reminder.leadText.min120'),
      });
    },
    workBody: (place, time) =>
      time ? t('reminder.workBodyAt', { place, time }) : t('reminder.workBody', { place }),
    undatedTitle: t('reminder.undatedTitle'),
    undatedBody: (count) =>
      count === 1 ? t('reminder.undatedBodyOne') : t('reminder.undatedBodyMany', { count }),
  };
}
