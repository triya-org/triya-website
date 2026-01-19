import { Metadata } from 'next';
import { pageMetadata } from '@/app/lib/seo-config';

export const metadata: Metadata = pageMetadata.terms;

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}