import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'License Plate Recognition (ANPR) Software | AI LPR — Triya',
  description:
    'License plate recognition software from Triya — AI ANPR/LPR on your existing CCTV for automated gate access, visitor vehicle tracking and parking enforcement.',
  keywords: [
    'license plate recognition software',
    'ANPR software',
    'LPR system',
    'automatic number plate recognition',
    'LPR gate access',
    'ANPR parking',
    'AI license plate recognition',
  ],
  openGraph: {
    title: 'AI License Plate Recognition (ANPR/LPR) Software by Triya',
    description:
      'Add AI license plate recognition to your existing cameras — automated LPR gate access, contractor and visitor vehicle tracking, and ANPR parking enforcement.',
    images: ['/og-image.png'],
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.triya.ai/solutions/license-plate-recognition/',
  },
};

export default function LicensePlateRecognitionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
