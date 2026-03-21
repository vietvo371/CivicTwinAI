'use client';

import { useTranslation, Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const FLAGS: Record<Locale, { flag: string; label: string }> = {
  vi: { flag: '🇻🇳', label: 'Tiếng Việt' },
  en: { flag: '🇬🇧', label: 'English' },
};

export function LanguageSwitcher({ variant = 'icon' }: { variant?: 'icon' | 'full' }) {
  const { locale, setLocale } = useTranslation();
  const next: Locale = locale === 'vi' ? 'en' : 'vi';
  const current = FLAGS[locale];
  const nextFlag = FLAGS[next];

  if (variant === 'full') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocale(next)}
        className="gap-2 text-xs font-medium"
        title={`Switch to ${nextFlag.label}`}
      >
        <span className="text-base">{current.flag}</span>
        {current.label}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLocale(next)}
      className="h-8 w-8 rounded-lg"
      title={`Switch to ${nextFlag.label}`}
    >
      <span className="text-base">{current.flag}</span>
    </Button>
  );
}
