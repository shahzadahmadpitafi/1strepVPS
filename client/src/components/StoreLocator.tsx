import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, User, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';
import ScrollReveal from '@/components/ScrollReveal';

type Reseller = {
  id: string;
  businessName: string;
  contactPerson: string;
  businessAddress: string;
  phoneNumber: string;
  tier: string;
  storefrontSlug: string | null;
};

const tierColors = {
  bronze: { bg: 'bg-yellow-900/20', border: 'border-yellow-600/30', badge: 'bg-yellow-600/20 text-yellow-300' },
  silver: { bg: 'bg-gray-300/10', border: 'border-gray-400/30', badge: 'bg-gray-400/20 text-gray-300' },
  gold: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', badge: 'bg-yellow-500/20 text-yellow-200' },
  platinum: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', badge: 'bg-purple-500/20 text-purple-200' }
};

type CardProps = {
  reseller: Reseller;
  colors: typeof tierColors.bronze;
};

function RessellerCard({ reseller, colors }: CardProps) {
  const [, navigate] = useLocation();

  const handleCardClick = () => {
    if (reseller.storefrontSlug) {
      navigate(`/store/${reseller.storefrontSlug}`);
    }
  };

  return (
    <div
      className={`group relative h-full border ${colors.border} ${colors.bg} rounded-lg p-6 hover:border-primary/60 transition-all duration-300 hover-elevate ${reseller.storefrontSlug ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
      data-testid={`reseller-card-${reseller.id}`}
    >
      {/* Tier Badge */}
      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${colors.badge}`}>
        {reseller.tier}
      </div>

      {/* Content */}
      <div className="space-y-4 pt-4 flex flex-col h-full">
        {/* Business Name */}
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors" data-testid={`reseller-name-${reseller.id}`}>
            {reseller.businessName}
          </h3>
        </div>

        {/* Contact Person */}
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-300">Contact Person</p>
            <p className="text-white font-medium" data-testid={`reseller-contact-${reseller.id}`}>{reseller.contactPerson}</p>
          </div>
        </div>

        {/* Address */}
        <div
          className="flex items-start gap-3"
          onClick={(e) => {
            if (reseller.storefrontSlug) {
              e.stopPropagation();
              navigate(`/store/${reseller.storefrontSlug}`);
            }
          }}
          style={{ cursor: reseller.storefrontSlug ? 'pointer' : 'default' }}
        >
          <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-300">Location</p>
            <p
              className={`font-medium ${reseller.storefrontSlug ? 'text-primary hover:text-primary/80 transition-colors' : 'text-white'}`}
              data-testid={`reseller-address-${reseller.id}`}
            >
              {reseller.businessAddress}
            </p>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-start gap-3 pt-2 border-t border-white/10">
          <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-300">Phone</p>
            <a
              href={`tel:${reseller.phoneNumber}`}
              onClick={(e) => e.stopPropagation()}
              className="text-primary font-medium hover:text-primary/80 transition-colors"
              data-testid={`reseller-phone-${reseller.id}`}
            >
              {reseller.phoneNumber}
            </a>
          </div>
        </div>

        {/* Visit Store Button */}
        {reseller.storefrontSlug && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
              <span>Visit Store</span>
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StoreLocator() {
  const { data: resellers = [], isLoading } = useQuery<Reseller[]>({
    queryKey: ['/api/store-locator/resellers'],
  });

  if (isLoading) {
    return (
      <section className="py-24 px-4 bg-black" id="stores">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">Locations</div>
            <h2 className="text-5xl font-bold text-white">Find a Store</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-900 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (resellers.length === 0) {
    return (
      <section className="py-24 px-4 bg-black" id="stores">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Store Locator Coming Soon</h2>
            <p className="text-gray-400">We are currently building our network of authorised retailers.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-4 bg-black" id="stores">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <div className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">Locations</div>
            <h2 className="text-5xl font-bold text-white mb-4">Find Our Resellers</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Discover authorised 1stRep retailers near you. Our trusted partners across the UK offer premium activewear and expert advice.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resellers.map((reseller, index) => {
            const colors = tierColors[reseller.tier as keyof typeof tierColors] || tierColors.bronze;
            return (
              <ScrollReveal key={reseller.id} delay={index * 0.05} direction="up">
                <RessellerCard reseller={reseller} colors={colors} />
              </ScrollReveal>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-16 pt-16 border-t border-gray-900">
          <ScrollReveal>
            <div className="text-center">
              <p className="text-gray-400 mb-4">Visit any of our {resellers.length} authorised retailers for expert advice and premium activewear</p>
              <div className="flex flex-wrap justify-center gap-8">
                {Object.entries(
                  resellers.reduce((acc, r) => {
                    acc[r.tier] = (acc[r.tier] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([tier, count]) => (
                  <div key={tier} className="text-center">
                    <div className="text-3xl font-bold text-primary capitalize">{count}</div>
                    <div className="text-sm text-gray-400 uppercase tracking-wider">{tier} Tier</div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
