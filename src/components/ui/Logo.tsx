import React from 'react';

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> { }

export const Logo: React.FC<LogoProps> = (props) => {
  return (
    <img src="/CEKPay-logo.png" alt="CEKPay Logo" {...props} />
  );
};
