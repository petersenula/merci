'use client';

import { QRCodeCanvas } from 'qrcode.react';
import React from 'react';

type QRWithLogoProps = {
  value: string;
};

export default function QRWithLogo({ value }: QRWithLogoProps) {
  return (
    <div className="inline-block bg-white p-4 rounded-xl shadow-lg">
      <QRCodeCanvas
        value={value}
        size={256}
        level="H"
        includeMargin
        imageSettings={{
          src: '/images/logoQR.png', // твой логотип
          height: 64,
          width: 64,
          excavate: true,
        }}
      />
    </div>
  );
}
