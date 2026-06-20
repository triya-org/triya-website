import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'On-Premise & Edge Video Analytics | Data-Sovereign AI CCTV — Triya',
  description:
    'On-premise & edge AI video analytics that never leaves your premises. Triya runs every detection locally on an Edge Box for data sovereignty, regulated, offline sites.',
  alternates: {
    canonical: 'https://www.triya.ai/solutions/on-premise-video-analytics/',
  },
  openGraph: {
    title: 'On-Premise & Edge Video Analytics | Data-Sovereign AI CCTV — Triya',
    description:
      'On-premise & edge AI video analytics that never leaves your premises. Triya runs every detection locally on an Edge Box for data sovereignty, regulated, offline sites.',
    url: 'https://www.triya.ai/solutions/on-premise-video-analytics/',
    type: 'website',
  },
};

export default function OnPremiseVideoAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
