import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PPE Compliance Monitoring | AI PPE & Safety-Helmet Detection — Triya',
  description:
    'AI PPE detection on your existing CCTV. Real-time safety-helmet and hi-vis vest detection verifies workers wear required PPE in designated zones and alerts on non-compliance.',
  alternates: {
    canonical: 'https://www.triya.ai/solutions/ppe-compliance-monitoring/',
  },
  openGraph: {
    title: 'PPE Compliance Monitoring | AI PPE & Safety-Helmet Detection — Triya',
    description:
      'PPE compliance monitoring software that adds AI PPE detection to existing cameras — hard hat, helmet and hi-vis vest detection with instant non-compliance alerts.',
    url: 'https://www.triya.ai/solutions/ppe-compliance-monitoring/',
    type: 'website',
  },
};

export default function PpeComplianceMonitoringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
