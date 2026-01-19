import { Metadata } from 'next';
import { pageMetadata } from '@/app/lib/seo-config';

export const metadata: Metadata = pageMetadata.about;

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}