// Single source of truth for the Spike mark: a solid "P" split by an upward arrow.
// Used by the in-app logo and the generated social preview images.
// src/app/icon.svg and docs/assets/spike-logo.svg are static copies; keep them in sync.

export const LOGO_VIEWBOX = '157 150 1000 1000';
export const LOGO_INK = '#3A3A3A';
export const LOGO_PAPER = '#EDEDEB';

export const LOGO_PATHS = [
  'M407 278 H680 C820 278 920 390 920 540 C920 690 810 800 660 805 V600 L783 708 L632 462 L568 575 C470 590 395 560 395 500 V290 Q395 278 407 278 Z',
  'M395 1010 V770 C395 690 450 615 559 592 L495 705 L612 615 V1010 Q612 1022 600 1022 H407 Q395 1022 395 1010 Z',
] as const;

/** Standalone SVG markup of the mark on its rounded tile. */
export function logoSvg({ tile = true }: { tile?: boolean } = {}): string {
  const bg = tile
    ? `<rect x="157" y="150" width="1000" height="1000" rx="230" fill="${LOGO_PAPER}"/>`
    : '';
  const paths = LOGO_PATHS.map((d) => `<path d="${d}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}" fill="none">${bg}<g fill="${LOGO_INK}">${paths}</g></svg>`;
}

