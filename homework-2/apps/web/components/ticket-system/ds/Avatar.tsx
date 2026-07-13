export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: AvatarSize;
  style?: React.CSSProperties;
}

const sizes: Record<AvatarSize, number> = { xs: 20, sm: 26, md: 32, lg: 40 };

// Deterministic tint from name so avatars are stable per agent/customer.
const palette: Array<[string, string]> = [
  ['#e3e2fb', '#3c319e'],
  ['#e5f5ed', '#17935a'],
  ['#fdf0e6', '#d9631a'],
  ['#e9f1fb', '#2f7ecb'],
  ['#fbf3d9', '#8a6207'],
  ['#fdecee', '#bd2932'],
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = String(name || '?').trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

export function Avatar({ name = '', src = null, size = 'md', style = {} }: AvatarProps) {
  const px = sizes[size];
  const [bg, fg] = palette[hash(name) % palette.length];
  const common: React.CSSProperties = {
    width: px,
    height: px,
    borderRadius: '50%',
    flex: '0 0 auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-bold)' as unknown as number,
    fontSize: px * 0.42,
    letterSpacing: '0.01em',
    overflow: 'hidden',
    userSelect: 'none',
    ...style,
  };
  if (src) {
    return <img src={src} alt={name} style={{ ...common, objectFit: 'cover' }} />;
  }
  return <span style={{ ...common, background: bg, color: fg }}>{initials(name)}</span>;
}
