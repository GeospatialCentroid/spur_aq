import React, { useEffect, useState } from 'react';
import './InfoCard.css';
import { useTranslation } from 'react-i18next';

type InfoData = {
  text?: string;
  image?: string;
  video?: string;
};

const parseInfoCardText = (raw: string): InfoData => {
  const lines = raw.split('\n');
  const data: InfoData = {};
  let currentKey = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed === '') continue;

    if (trimmed.startsWith('TEXT:')) {
      currentKey = 'text';
      data.text = '';
    } else if (trimmed.startsWith('IMAGE:')) {
      currentKey = '';
      data.image = trimmed.replace('IMAGE:', '').trim();
    } else if (trimmed.startsWith('VIDEO:')) {
      currentKey = '';
      data.video = trimmed.replace('VIDEO:', '').trim();
    } else if (currentKey === 'text') {
      data.text += (data.text ? ' ' : '') + line.trim();
    }
  }
  return data;
};

const InfoCard: React.FC = () => {
  const [info, setInfo] = useState<InfoData>({});
  const { t, i18n } = useTranslation('info');

useEffect(() => {
  const lang = i18n.resolvedLanguage || i18n.language || "en";
  const path = lang.startsWith("es") ? "/InfoCard.es.txt" : "/InfoCard.txt";

  let cancelled = false;

  const load = async () => {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const txt = await res.text();
      const parsed = parseInfoCardText(txt);

      // If the ES file exists but has no usable keys, fall back to EN.
      if (!parsed.text && !parsed.image && !parsed.video && !cancelled && !path.endsWith("/InfoCard.txt")) {
        const resEn = await fetch("/InfoCard.txt");
        const txtEn = await resEn.text();
        setInfo(parseInfoCardText(txtEn));
        return;
      }

      if (!cancelled) setInfo(parsed);
    } catch {
      // Hard fallback to EN
      try {
        const resEn = await fetch("/InfoCard.txt");
        const txtEn = await resEn.text();
        if (!cancelled) setInfo(parseInfoCardText(txtEn));
      } catch (e2) {
        console.error("Failed to load InfoCard files", e2);
      }
    }
  };

  load();
  return () => { cancelled = true; };
}, [i18n.resolvedLanguage]);


  return (
    <div className="info-scroll" role="region" aria-label={String(t("ARIA.SCROLL_REGION"))}>
      {info.text && (
        <>
          <p className="card-text info-card__text">{info.text}</p>
        </>
      )}

      {info.image && (
        <img
          src={info.image}
          alt={String(t("ALT.INFO_IMAGE"))}
          className="info-card__media info-card__media--bottom"
          loading="lazy"
        />
      )}

      {!info.image && info.video && (
        <video className="info-card__media info-card__media--bottom" controls preload="metadata">
          <source src={info.video} type="video/mp4" />
          {t("UI.NO_VIDEO_SUPPORT")}
        </video>
      )}
    </div>   
  );
};

export default InfoCard;
