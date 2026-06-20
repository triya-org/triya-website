import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Real Estate & Facilities Video Analytics | AI CCTV for Property & Construction — Triya',
  description: 'AI CCTV for facilities on your existing cameras: real estate and facilities management video analytics, construction site safety AI and LPR gate access.',
  alternates: {
    canonical: 'https://www.triya.ai/use-cases/real-estate/',
  },
  openGraph: {
    title: 'Real Estate & Facilities Video Analytics | AI CCTV for Property & Construction — Triya',
    description: 'Real estate and facilities management video analytics on your existing CCTV. Construction site safety AI, property security analytics, and license plate recognition gate access.',
    url: 'https://www.triya.ai/use-cases/real-estate/',
    type: 'website',
  },
};

export default function RealEstateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
