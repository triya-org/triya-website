import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface UseCase {
  title: string;
  href: string;
  description: string;
  icon?: string;
}

interface RelatedUseCasesProps {
  currentCase: string;
}

const allUseCases: UseCase[] = [
  {
    title: "Smart Cities",
    href: "/use-cases/smart-cities",
    description: "Transform urban security with real-time traffic monitoring, crowd analytics, and incident detection.",
    icon: "🏙️"
  },
  {
    title: "Retail",
    href: "/use-cases/retail",
    description: "Prevent losses and optimize operations with theft detection, customer analytics, and queue management.",
    icon: "🛍️"
  },
  {
    title: "Manufacturing",
    href: "/use-cases/manufacturing",
    description: "Ensure workplace safety with PPE compliance monitoring, hazard detection, and operational analytics.",
    icon: "🏭"
  },
  {
    title: "Event Management",
    href: "/use-cases/events",
    description: "Secure large events with crowd control, VIP tracking, and real-time incident response.",
    icon: "🎪"
  }
];

export function RelatedUseCases({ currentCase }: RelatedUseCasesProps) {
  // Filter out the current use case and select 2-3 related ones
  const relatedCases = allUseCases
    .filter(useCase => !useCase.href.includes(currentCase))
    .slice(0, 3);

  return (
    <section className="py-16 border-t">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">
            Explore Other Solutions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover how Triya&apos;s AI surveillance platform transforms security across different industries
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {relatedCases.map((useCase) => (
            <Link key={useCase.href} href={useCase.href}>
              <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg group">
                <div className="p-6">
                  <div className="text-4xl mb-4">{useCase.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {useCase.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {useCase.description}
                  </p>
                  <div className="flex items-center text-primary font-medium gap-1">
                    Learn more <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Ready to transform your security operations?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors gap-2"
          >
            Request a Demo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}