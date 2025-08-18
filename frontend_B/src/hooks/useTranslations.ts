import { useTranslation } from 'react-i18next';

export const useTranslations = () => {
  const { t, i18n } = useTranslation();

  return {
    t,
    currentLanguage: i18n.language,
    changeLanguage: (lng: string) => i18n.changeLanguage(lng),
    formatDate: (date: Date) => {
      return new Intl.DateTimeFormat(i18n.language).format(date);
    },
    formatNumber: (num: number) => {
      return new Intl.NumberFormat(i18n.language).format(num);
    }
  };
};
