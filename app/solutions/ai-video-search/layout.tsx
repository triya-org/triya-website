import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Video Search | Search Your CCTV Footage in Plain English — Triya',
  description:
    'AI video search for your cameras. Ask your CCTV questions in plain language — "show me intrusions from yesterday" — and get timestamped clips back in seconds, no scrubbing.',
  alternates: {
    canonical: 'https://www.triya.ai/solutions/ai-video-search/',
  },
  openGraph: {
    title: 'AI Video Search | Search Your CCTV Footage in Plain English — Triya',
    description:
      'Natural-language CCTV search built on Triya\'s real-time AI detections. Ask your cameras a question in English or Arabic and find the footage by description in seconds.',
    url: 'https://www.triya.ai/solutions/ai-video-search/',
    type: 'website',
  },
};

export default function AiVideoSearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
