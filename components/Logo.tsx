// Brand marks, drawn as SVG so they stay sharp and can adapt to dark backgrounds.
// Dark parts use currentColor; set `color` on a parent to switch between light and dark.

const ORANGE = "#f47b16";

/** The app-icon / favicon mark: house on a rounded dark tile. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ flex: "none" }}>
      <rect width="100" height="100" rx="24" fill="#1b222b" />
      <path d="M50 22 92 58 84 58 50 30 16 58 8 58Z" fill="#fff" />
      <rect x="68" y="28" width="7" height="18" fill="#fff" />
      <path d="M44 41 12 71 22 71 46 47Z" fill={ORANGE} />
      <path d="M50 35 54 31 90 71 79 71Z" fill={ORANGE} />
      <g fill="#fff">
        <rect x="42" y="55" width="7" height="7" />
        <rect x="51" y="55" width="7" height="7" />
        <rect x="42" y="64" width="7" height="7" />
        <rect x="51" y="64" width="7" height="7" />
      </g>
    </svg>
  );
}

/** Full stacked logo: roof, "Paul's", HOME REPAIR, and the tagline. */
export function LogoFull({ width = 260, tagline = true }: { width?: number; tagline?: boolean }) {
  const h = tagline ? 330 : 290;
  return (
    <svg width={width} viewBox={`0 0 560 ${h}`} role="img" aria-label="Paul's Home Repair">
      <g fill="currentColor">
        <path d="M70 128 270 14 286 26 104 128Z" />
        <path d="M270 14 344 58 344 74 286 26Z" />
        <rect x="330" y="34" width="24" height="62" />
        <rect x="214" y="66" width="20" height="20" />
        <rect x="240" y="66" width="20" height="20" />
        <rect x="214" y="92" width="20" height="20" />
        <rect x="240" y="92" width="20" height="20" />
      </g>
      <path d="M268 42 282 34 446 136 410 136Z" fill={ORANGE} />
      <text x="280" y="242" textAnchor="middle" fill="currentColor" fontSize="138" fontWeight="900" letterSpacing="-6">
        Paul&rsquo;s
      </text>
      <text x="280" y="288" textAnchor="middle" fill={ORANGE} fontSize="40" fontWeight="800" letterSpacing="12">
        HOME REPAIR
      </text>
      {tagline && (
        <>
          <rect x="10" y="314" width="56" height="3" fill={ORANGE} />
          <rect x="494" y="314" width="56" height="3" fill={ORANGE} />
          <text x="280" y="322" textAnchor="middle" fill="currentColor" fontSize="19" fontWeight="600" textLength="390" lengthAdjust="spacing">
            FIX <tspan fill={ORANGE}>|</tspan> IMPROVE <tspan fill={ORANGE}>|</tspan> MAINTAIN
          </text>
        </>
      )}
    </svg>
  );
}

/** Horizontal lockup for the nav bar: mark + wordmark. */
export function LogoLockup() {
  return (
    <span className="lockup">
      <LogoMark size={40} />
      <span className="lockup-text">
        <strong>Paul&rsquo;s</strong>
        <small>HOME REPAIR</small>
      </span>
    </span>
  );
}
