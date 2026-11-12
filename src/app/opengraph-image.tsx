import { ImageResponse } from 'next/og';
import { SITE } from './_brand/site';
import { logoDataUri } from './_brand/logoDataUri';

export const alt = 'Spike: supervised autonomy for PayPal refunds and disputes';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  const pills = ['LLM proposes, code disposes', 'Auto-refunds within your cap', 'Approval for anything material'];
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          background: SITE.paper,
          padding: '0 88px',
          gap: 72,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDataUri({ tile: false })} width={340} height={340} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 120, fontWeight: 700, color: SITE.ink, letterSpacing: -4, lineHeight: 1 }}>
            {SITE.name}
          </div>
          <div style={{ fontSize: 40, color: '#555555', marginTop: 20, lineHeight: 1.25 }}>{SITE.tagline}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 40 }}>
            {pills.map((p) => (
              <div
                key={p}
                style={{
                  display: 'flex',
                  fontSize: 24,
                  color: SITE.ink,
                  border: `2px solid ${SITE.ink}`,
                  borderRadius: 999,
                  padding: '8px 22px',
                }}
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
