import React from 'react';
import i18n from '../i18n/i18n-setup';
import { useTranslation } from 'react-i18next';

type Lang = { code: string; labelKey: string };

// Add more later by extending this list and adding the labels in your i18n files
const LANGS: Lang[] = [
  { code: 'en', labelKey: 'LANG.EN' },
  { code: 'es', labelKey: 'LANG.ES' },
];

const LanguageDropup: React.FC = () => {
  const { t } = useTranslation('common');
  const current = (i18n.resolvedLanguage || i18n.language || 'en').slice(0, 2).toLowerCase();

  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLUListElement | null>(null);

  // Close on outside click / Escape
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return;
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const setLang = (code: string) => {
    i18n.changeLanguage(code);
    try { localStorage.setItem('lang', code); } catch {}
    setOpen(false);
  };

  const currentLabel =
    t(LANGS.find(l => l.code === current)?.labelKey ?? 'LANG.EN');

  return (
    <div className="lang-dropup">
        <button
            type="button"
            ref={btnRef}
            className="btn btn-outline-light btn-sm"  
            aria-haspopup="true"
            aria-expanded={open ? 'true' : 'false'}
            aria-controls="lang-dropup-menu"
            title={t('LANG.LABEL') as string}
            onClick={() => setOpen(o => !o)}
            >
            {currentLabel}
            <span aria-hidden="true" style={{ marginLeft: 6 }}>▴</span>
        </button>


      {open && (
        <ul
          id="lang-dropup-menu"
          role="menu"
          ref={menuRef}
          className="lang-dropup-menu"
        >
          {LANGS.map(({ code, labelKey }) => (
            <li key={code} role="none">
              <button
                role="menuitemradio"
                aria-checked={code === current}
                className={`lang-dropup-item${code === current ? ' active' : ''}`}
                onClick={() => setLang(code)}
              >
                {t(labelKey)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageDropup;
