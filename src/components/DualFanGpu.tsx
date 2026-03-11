interface Props {
  size?: 'sm' | 'lg';
  spinning?: boolean;
}

export default function DualFanGpu({ size = 'lg', spinning = true }: Props) {
  const isLg = size === 'lg';
  const w = isLg ? 52 : 22;
  const h = isLg ? 40 : 16;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 130 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={isLg ? '' : 'inline-block'}
    >
      <defs>
        <filter id="fan-glow">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#76B900" floodOpacity="0.5" />
        </filter>
      </defs>

      <rect x="2" y="2" width="126" height="96" rx="8" ry="8" fill="#1e1e1e" stroke="#3a3a3a" strokeWidth="2" />

      <rect x="8" y="8" width="114" height="84" rx="5" ry="5" fill="#242424" stroke="#333" strokeWidth="1" />

      <line x1="65" y1="12" x2="65" y2="88" stroke="#2a2a2a" strokeWidth="1" strokeDasharray="3 3" />

      <rect x="10" y="90" width="8" height="6" rx="1" fill="#333" />
      <rect x="22" y="90" width="8" height="6" rx="1" fill="#333" />
      <rect x="34" y="90" width="8" height="6" rx="1" fill="#333" />
      <rect x="88" y="90" width="8" height="6" rx="1" fill="#333" />
      <rect x="100" y="90" width="8" height="6" rx="1" fill="#333" />
      <rect x="112" y="90" width="8" height="6" rx="1" fill="#333" />

      <g filter="url(#fan-glow)">
        <FanBlades cx={38} cy={48} spinning={spinning} direction="cw" />
      </g>
      <g filter="url(#fan-glow)">
        <FanBlades cx={92} cy={48} spinning={spinning} direction="ccw" />
      </g>

      <circle cx="38" cy="48" r="24" fill="none" stroke="#3a3a3a" strokeWidth="1.5" />
      <circle cx="92" cy="48" r="24" fill="none" stroke="#3a3a3a" strokeWidth="1.5" />

      <circle cx="38" cy="48" r="5" fill="#1a1a1a" stroke="#76B900" strokeWidth="1" />
      <circle cx="92" cy="48" r="5" fill="#1a1a1a" stroke="#76B900" strokeWidth="1" />
    </svg>
  );
}

function FanBlades({
  cx,
  cy,
  spinning,
  direction,
}: {
  cx: number;
  cy: number;
  spinning: boolean;
  direction: 'cw' | 'ccw';
}) {
  const bladeCount = 7;
  const blades = Array.from({ length: bladeCount }, (_, i) => {
    const angle = (360 / bladeCount) * i;
    return (
      <path
        key={i}
        d={bladePath(cx, cy, angle)}
        fill="#76B900"
        fillOpacity="0.7"
        stroke="#76B900"
        strokeWidth="0.5"
        strokeOpacity="0.9"
      />
    );
  });

  const animClass = spinning
    ? direction === 'cw'
      ? 'animate-fan-spin'
      : 'animate-fan-spin-reverse'
    : '';

  return (
    <g className={animClass} style={{ transformOrigin: `${cx}px ${cy}px` }}>
      {blades}
    </g>
  );
}

function bladePath(cx: number, cy: number, angleDeg: number): string {
  const r = 20;
  const rad = (angleDeg * Math.PI) / 180;
  const curve = ((angleDeg + 35) * Math.PI) / 180;
  const tipX = cx + r * Math.cos(rad);
  const tipY = cy + r * Math.sin(rad);
  const ctrlX = cx + r * 0.65 * Math.cos(curve);
  const ctrlY = cy + r * 0.65 * Math.sin(curve);
  return `M ${cx} ${cy} Q ${ctrlX} ${ctrlY} ${tipX} ${tipY}`;
}
