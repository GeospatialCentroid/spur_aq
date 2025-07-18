import React, { useEffect, useState } from 'react';

// these are the different types that can be added to the info card. They are all ? optional so you do not need any of them but can use all of them if you want. 
type InfoData = {
  text?: string;
  image?: string;
  video?: string;
};
// this is parsing the info entered into the txt file and stores it in an infoData array as text, image, or video. 
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

// Actual layout of the info card. This adds in the text, image or video and returns the final product to info.tsx
const InfoCard: React.FC = () => {
  const [info, setInfo] = useState<{ text?: string; image?: string; video?: string }>({});

  useEffect(() => {
    fetch('/InfoCard.txt')
      .then((res) => res.text())
      .then((text) => {
        const parsed = parseInfoCardText(text);
        setInfo(parsed);
      })
      .catch((err) => console.error('Failed to load InfoCard.txt', err));
  }, []);
// I also added the capabilty to add the logo to the info section in the return statement. 
// Its currently commented out thought because I think it may look better in the top banner. 
  return (
    <div className="col-md-4">
      <div className="card h-100">    
        {/* <div style={{textAlign: 'left'}}> 
            <img
                src="/Photos/InfoCardPhotos/CSUSpur_horiz_campus_rev_rgb.webp"
                alt="CSU Spur Logo"
                style={{
                    height: '50px',
                    objectFit: 'contain',
                    padding: '0.5rem',
                    backgroundColor: '#f0f0f0' // optional for contrast
                }}
                />
        </div> */}

        <div className="card-body">
             <h5 className="card-title">Info</h5>
          <p className="card-text">{info.text || 'Loading...'}</p>
          {info.image && (
            <img
              src={info.image}
              alt="Info"
              className="img-fluid rounded mt-2"
              style={{ maxHeight: '200px', objectFit: 'cover' }}
            />
          )}
          {info.video && (
            <video controls className="w-100 mt-2" style={{ maxHeight: '200px' }}>
              <source src={info.video} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoCard;
