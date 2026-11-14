/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG needs an image role. */
import createQRCode from 'qrcode-generator';

interface QRCodeProps {
  value: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  size?: number;
  'aria-label'?: string;
}

export function QRCodeSVG({
  value,
  level = 'L',
  includeMargin = false,
  size = 128,
  'aria-label': label = 'Dashboard address QR code',
}: QRCodeProps) {
  if (value.length > 2048) {
    return null;
  }

  const modules: { row: number; column: number }[] = [];
  let count = 0;

  try {
    const qr = createQRCode(0, level);
    qr.addData(value);
    qr.make();
    count = qr.getModuleCount();

    for (let row = 0; row < count; row += 1) {
      for (let column = 0; column < count; column += 1) {
        if (qr.isDark(row, column)) {
          modules.push({ row, column });
        }
      }
    }
  } catch {
    return null;
  }

  const margin = includeMargin ? 4 : 0;
  const dimension = count + margin * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${dimension} ${dimension}`}
      role="img"
      aria-label={label}
      shape-rendering="crispEdges"
    >
      <title>{label}</title>
      <rect width={dimension} height={dimension} fill="#fff" />
      <g fill="#000">
        {modules.map(({ row, column }) => (
          <rect
            key={`${row}-${column}`}
            x={column + margin}
            y={row + margin}
            width="1"
            height="1"
          />
        ))}
      </g>
    </svg>
  );
}
