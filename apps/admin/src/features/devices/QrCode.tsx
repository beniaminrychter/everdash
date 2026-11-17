/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG needs an image role. */
import { useMemo } from 'react';
import createQRCode from 'qrcode-generator';

interface QrCodeProps {
  value: string;
  size?: number;
  label?: string;
}

const quietZone = 4;

/** Draws the QR code as one SVG path. It stays white on black in both themes so it scans. */
export function QrCode({ value, size = 160, label = 'Dashboard QR code' }: QrCodeProps) {
  const code = useMemo(() => {
    try {
      const qr = createQRCode(0, 'M');

      qr.addData(value);
      qr.make();

      const count = qr.getModuleCount();
      let path = '';

      for (let row = 0; row < count; row += 1) {
        for (let column = 0; column < count; column += 1) {
          if (qr.isDark(row, column)) {
            path += `M${column + quietZone} ${row + quietZone}h1v1h-1z`;
          }
        }
      }

      return { path, dimension: count + quietZone * 2 };
    } catch {
      return null;
    }
  }, [value]);

  if (!code) {
    return null;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${code.dimension} ${code.dimension}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className="rounded-md border"
    >
      <title>{label}</title>
      <rect width={code.dimension} height={code.dimension} fill="#fff" />
      <path d={code.path} fill="#000" />
    </svg>
  );
}
