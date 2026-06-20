import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add AI to Your Existing CCTV | Camera-Agnostic Video Analytics — Triya',
  description:
    'Add AI to your existing CCTV with Triya. Camera-agnostic video analytics over RTSP/ONVIF works with any IP camera — upgrade CCTV to AI, no replacement, no lock-in.',
  alternates: {
    canonical: 'https://www.triya.ai/solutions/add-ai-to-existing-cctv/',
  },
  openGraph: {
    title: 'Add AI to Your Existing CCTV | Camera-Agnostic Video Analytics — Triya',
    description:
      'Turn the cameras you already own into an AI video-analytics system. Camera-agnostic, RTSP/ONVIF, works with any IP camera — no rip-and-replace, no vendor lock-in.',
    url: 'https://www.triya.ai/solutions/add-ai-to-existing-cctv/',
    siteName: 'Triya',
    type: 'website',
  },
};

export default function AddAiToExistingCctvLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
