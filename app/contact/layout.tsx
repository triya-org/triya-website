import { Metadata } from 'next';
import { pageMetadata } from '@/app/lib/seo-config';

export const metadata: Metadata = pageMetadata.contact;

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}