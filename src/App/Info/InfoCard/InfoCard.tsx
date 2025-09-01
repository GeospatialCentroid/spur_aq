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

  return (
    <div className="col-md-4">
    <div className="card info-card">
          <div className="card-body info-card__body">
            <div className="info-scroll" role="region" aria-label="Information">
              {info.text && (
                <>
                  <h5 className="card-title info-card__title">About</h5>
                  <p className="card-text info-card__text">{info.text}</p>
                </>
              )}

              {info.image && (
                <img
                  src={info.image}
                  alt="Info"
                  className="info-card__media info-card__media--bottom"
                  loading="lazy"
                />
              )}

              {!info.image && info.video && (
                <video className="info-card__media info-card__media--bottom" controls preload="metadata">
                  <source src={info.video} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}

              {!info.text && (info.image || info.video) && (
                <h5 className="card-title info-card__title info-card__title--floating">About</h5>
              )}
            </div>
          </div>
        </div>
        </div>
  );
};

export default InfoCard;
