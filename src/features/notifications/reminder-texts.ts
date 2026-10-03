import { i18n } from '@/i18n';
import type { ReminderTexts } from './reminder-plan';

/** Textos dos avisos em pt-BR (os avisos são montados fora de componentes). */
export function reminderTexts(): ReminderTexts {
  const t = i18n.getFixedT(null, 'notifications');
  const agenda = i18n.getFixedT(null, 'agenda');
  return {
    receivableTitle: (count) =>
      count === 1 ? t('reminder.receivableTitleOne') : t('reminder.receivableTitleMany'),
    receivableBody: t('reminder.receivableBody'),
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
