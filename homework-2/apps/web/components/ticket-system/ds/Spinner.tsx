export interface SpinnerProps {
  size?: number;
  thickness?: number;
  color?: string;
  style?: React.CSSProperties;
}

export function Spinner({ size = 18, thickness = 2.5, color = 'var(--accent)', style = {} }: SpinnerProps) {
  return (
    <span role="status" aria-label="Loading" style={{ display: 'inline-flex', ...style }}>
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'triage-spin 0.7s linear infinite' }}>
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth={thickness} style={{ color }} />
        <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" />
      </svg>
      <style>{`@keyframes triage-spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  );
}
