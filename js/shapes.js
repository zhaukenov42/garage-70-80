// GARAGE 70/80 — генерация стилизованных SVG-силуэтов кузовов

const BODY_SHAPES = {
  sport: {
    body: 'M15,110 C15,97 26,87 42,84 L72,60 C88,49 102,45 122,45 L188,45 C204,45 216,50 226,59 L256,82 C272,90 287,96 287,106 L287,112 L15,112 Z',
    windows: ['M97,58 L131,47 L184,47 L217,60 L201,69 L106,69 Z'],
    wheels: [
      { cx: 78, cy: 112, r: 19 },
      { cx: 224, cy: 112, r: 19 },
    ],
    extras: 'M270,44 L288,42 L288,48 L272,50 Z M266,44 L266,50 L272,50 L270,44 Z',
  },
  coupe: {
    body: 'M15,112 C15,99 26,90 41,88 L61,69 C76,53 96,44 121,44 L176,44 C196,44 207,51 212,62 L231,89 C251,91 286,95 286,107 L286,112 Z',
    windows: ['M86,66 L111,49 L171,49 L201,68 L181,75 L96,75 Z'],
    wheels: [
      { cx: 80, cy: 112, r: 19 },
      { cx: 226, cy: 112, r: 19 },
    ],
    extras: '',
  },
  sedan: {
    body: 'M10,112 C10,99 21,90 36,88 L56,71 C69,56 86,49 106,49 L151,49 C166,49 176,54 181,65 L189,88 L246,91 C266,92 291,97 291,108 L291,112 Z',
    windows: [
      'M81,68 L101,53 L146,53 L163,68 L152,74 L92,74 Z',
      'M166,66 L184,68 L189,87 L173,87 Z',
    ],
    wheels: [
      { cx: 78, cy: 112, r: 18 },
      { cx: 240, cy: 112, r: 18 },
    ],
    extras: '',
  },
  compact: {
    body: 'M20,112 C20,97 31,87 46,85 L56,66 C66,51 81,45 101,45 L166,45 C181,45 191,51 196,63 L206,85 C219,87 251,91 251,106 L251,112 Z',
    windows: ['M71,67 L86,51 L156,51 L186,71 L166,77 L81,77 Z'],
    wheels: [
      { cx: 68, cy: 112, r: 18 },
      { cx: 202, cy: 112, r: 18 },
    ],
    extras: '',
  },
  luxury: {
    body: 'M5,112 C5,98 18,90 35,88 L75,66 C90,52 105,46 130,46 L165,46 C180,46 188,52 192,60 L200,88 L276,91 C293,93 296,99 296,109 L296,112 Z',
    windows: ['M112,64 L136,50 L176,50 L196,68 L181,75 L121,75 Z'],
    wheels: [
      { cx: 65, cy: 112, r: 19 },
      { cx: 258, cy: 112, r: 19 },
    ],
    extras: '',
  },
  suv: {
    body: 'M12,116 L12,76 C12,61 24,51 42,51 L228,51 C246,51 258,61 258,76 L258,116 Z',
    windows: [
      'M34,59 L98,59 L98,82 L34,82 Z',
      'M108,59 L222,59 L222,82 L108,82 Z',
    ],
    wheels: [
      { cx: 62, cy: 116, r: 22 },
      { cx: 208, cy: 116, r: 22 },
    ],
    extras: '',
  },
};

function shadeColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) + Math.round(255 * percent);
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * percent);
  let b = (num & 0x0000ff) + Math.round(255 * percent);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function carSilhouetteSVG(shapeKey, color) {
  const shape = BODY_SHAPES[shapeKey] || BODY_SHAPES.coupe;
  const darkColor = shadeColor(color, -0.25);
  const windowsMarkup = shape.windows
    .map((d) => `<path d="${d}" fill="rgba(20,23,28,0.55)" stroke="rgba(230,235,240,0.25)" stroke-width="1"></path>`)
    .join('');
  const wheelsMarkup = shape.wheels
    .map(
      (w) => `<circle cx="${w.cx}" cy="${w.cy}" r="${w.r}" fill="#111318" stroke="#05070a" stroke-width="2"></circle>
      <circle cx="${w.cx}" cy="${w.cy}" r="${Math.round(w.r * 0.42)}" fill="#3a3f47"></circle>`
    )
    .join('');
  const extras = shape.extras
    ? `<path d="${shape.extras}" fill="${darkColor}"></path>`
    : '';

  return `
    <svg viewBox="0 0 300 140" class="car-silhouette" role="img" aria-hidden="true">
      <ellipse cx="150" cy="122" rx="140" ry="8" fill="rgba(0,0,0,0.35)"></ellipse>
      <path d="${shape.body}" fill="${color}" stroke="${darkColor}" stroke-width="2"></path>
      ${extras}
      ${windowsMarkup}
      ${wheelsMarkup}
    </svg>
  `;
}
