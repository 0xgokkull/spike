import { ImageResponse } from 'next/og';
import { SITE } from './_brand/site';
import { logoDataUri } from './_brand/logoDataUri';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// iOS applies its own rounded mask, so this is a full-bleed square.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: SITE.paper,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDataUri({ tile: false })} width={150} height={150} alt="" />
      </div>
    ),
    size,
  );
}
