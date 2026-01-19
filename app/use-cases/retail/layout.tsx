import { Metadata } from 'next';
import { pageMetadata } from '@/app/lib/seo-config';

export const metadata: Metadata = pageMetadata.retail;

export default function RetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}