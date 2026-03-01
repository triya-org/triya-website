import Link from 'next/link';
import { ArrowLeft, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Error */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary/20">404</h1>
          <h2 className="text-3xl font-bold mt-4 mb-2">Page Not Found</h2>
          <p className="text-muted-foreground text-lg">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Suggestions */}
        <div className="mb-8 p-6 bg-muted/30 rounded-lg">
          <h3 className="font-semibold mb-4">Were you looking for?</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-left">
            <Link href="/contact/" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowLeft className="h-4 w-4 rotate-180" />
              Request a Demo
            </Link>
            <Link href="/faq/" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowLeft className="h-4 w-4 rotate-180" />
              Frequently Asked Questions
            </Link>
            <Link href="/use-cases/smart-cities/" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowLeft className="h-4 w-4 rotate-180" />
              Smart Cities Solutions
            </Link>
            <Link href="/blog/" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowLeft className="h-4 w-4 rotate-180" />
              Read Our Blog
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/" className="gap-2">
              <Home className="h-4 w-4" />
              Go to Homepage
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/contact/" className="gap-2">
              <Search className="h-4 w-4" />
              Contact Support
            </Link>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="mt-12 text-sm text-muted-foreground">
          <p>
            If you believe this is an error, please{' '}
            <Link href="/contact/" className="text-primary hover:underline">
              contact us
            </Link>{' '}
            with the URL you were trying to reach.
          </p>
        </div>
      </div>
    </div>
  );
}