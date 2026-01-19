import { Metadata } from 'next';
import { pageMetadata } from '@/app/lib/seo-config';

export const metadata: Metadata = pageMetadata.manufacturing;

export default function ManufacturingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}