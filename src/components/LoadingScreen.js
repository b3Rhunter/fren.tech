import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="loading-container">
      <svg className="eth-logo" width="500" height="500" xmlns="http://www.w3.org/2000/svg">
        <path className="eth-path" d="m249.99999,5.03001l-149.74999,251.57998l149.74999,89.84999l149.74999,-89.84999l-149.74999,-251.57998m-149.74999,281.52998l149.74999,209.64999l149.74999,-209.64999l-149.74999,89.84999l-149.74999,-89.84999z"
        fill="#12aee2"/>
      </svg>
    </div>
  );
};

export default LoadingScreen;
