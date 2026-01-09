import { Metadata } from 'next';
import { pageMetadata } from '@/app/lib/seo-config';

export const metadata: Metadata = pageMetadata.privacy;

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}