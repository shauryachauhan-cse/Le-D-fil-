import qrcode from 'qrcode-generator';
import { writeFile } from 'node:fs/promises';

const domain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const origin = process.env.SITE_URL || (domain && `https://${domain}`);
if (!origin && process.env.VERCEL) {
  throw new Error('Set SITE_URL or enable Vercel system environment variables.');
}

if (origin) {
  const url = new URL(origin);
  if (url.protocol !== 'https:') throw new Error('The site URL must use HTTPS.');
  const qr = qrcode(0, 'Q');
  qr.addData(url.origin);
  qr.make();
  await writeFile('dist/assets/presentation-qr.svg', qr.createSvgTag(24, 120));
  const html = await import('node:fs/promises').then(fs => fs.readFile('dist/index.html', 'utf8'));
  await writeFile('dist/index.html', html.replaceAll('presentation-qr.png', 'presentation-qr.svg').replaceAll('Le-Defile-Presentation-QR.png', 'Le-Defile-Presentation-QR.svg'));
}
