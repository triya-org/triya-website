import { Metadata } from 'next';
import { pageMetadata } from '@/app/lib/seo-config';

export const metadata: Metadata = pageMetadata.events;

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}