import React from 'react';

const FadingRightArrow: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 100 100">
    <g>
      <polygon points="20,20 40,50 20,80" fill="#ccc" />
      <polygon points="40,20 60,50 40,80" fill="#888" />
      <polygon points="60,20 80,50 60,80" fill="#000" />
    </g>
  </svg>
);

export default FadingRightArrow;
