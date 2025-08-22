import React, { useEffect, useState } from 'react';
import './InfoCard.css';

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

  useEffect(() => {
    fetch('/InfoCard.txt')
      .then((res) => res.text())
      .then((text) => setInfo(parseInfoCardText(text)))
      .catch((err) => console.error('Failed to load InfoCard.txt', err));
  }, []);

  const hasMedia = Boolean(info.image || info.video);

  return (
    <div className="col-md-4">
      <div className={`card h-100 info-card ${hasMedia ? 'info-card--split' : ''}`}>
        <div className="card-body info-card__body">
          {/* TEXT half */}
          {info.text && (
            <div className="info-card__textWrap">
              <h5 className="card-title info-card__title">About</h5>
              <p className="card-text info-card__text">{info.text}</p>
            </div>
          )}

          {/* MEDIA half */}
          {info.image && (
            <div className="info-card__mediaWrap">
              <img
                src={info.image}
                alt="Info"
                className="info-card__media"
                loading="lazy"
              />
            </div>
          )}
          {(!info.image && info.video) && (
            <div className="info-card__mediaWrap">
              <video className="info-card__media" controls preload="metadata">
                <source src={info.video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* If no text, still show title small for consistency (optional) */}
          {!info.text && hasMedia && (
            <h5 className="card-title info-card__title info-card__title--floating">About</h5>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoCard;
