import { Metadata } from 'next';
import { pageMetadata } from '@/app/lib/seo-config';

export const metadata: Metadata = pageMetadata.smartCities;

export default function SmartCitiesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}