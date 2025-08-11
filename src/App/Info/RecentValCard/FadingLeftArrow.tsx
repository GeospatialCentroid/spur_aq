import React from 'react';

const FadingLeftArrow: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 100 100">
    <g>
      <polygon points="80,20 60,50 80,80" fill="#ccc" />
      <polygon points="60,20 40,50 60,80" fill="#888" />
      <polygon points="40,20 20,50 40,80" fill="#444" />
    </g>
  </svg>
);

export default FadingLeftArrow;
