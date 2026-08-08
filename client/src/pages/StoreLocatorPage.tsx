import HeaderClean from '@/components/HeaderClean';
import ScrollReveal from '@/components/ScrollReveal';
import StoreLocator from '@/components/StoreLocator';
import { MapPin, Phone, Clock, Navigation, Loader2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface CompanyStore {
  id: string;
  name: string;
  address: string;
  phone?: string;
  hours?: string;
  features?: string[];
  imageUrl?: string;
  mapUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export default function StoreLocatorPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: stores = [], isLoading } = useQuery<CompanyStore[]>({
    queryKey: ["/api/company-stores"],
  });

  return (
    <div className="min-h-screen bg-white">
      <HeaderClean />
      
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto py-20">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 mb-6 px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-semibold tracking-wider uppercase">
              <MapPin className="w-4 h-4" />
              Find Us
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight" data-testid="store-locator-heading">
              Store Locator
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <p className="text-xl md:text-2xl font-light leading-relaxed max-w-3xl mx-auto text-gray-200">
              Visit one of our stores for a hands-on experience with our premium performance gear.
            </p>
          </ScrollReveal>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      <StoreLocator />

      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Locations</div>
              <h2 className="text-5xl font-bold mb-6 text-black">Our Stores</h2>
            </div>
          </ScrollReveal>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-16">
              <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</h3>
              <p className="text-gray-500">
                We're opening new stores soon. Check back for updates on locations near you.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {stores.map((store, index) => (
                <ScrollReveal key={store.id} delay={index * 0.1}>
                  <div className="bg-gray-50 p-8 h-full" data-testid={`store-card-${store.id}`}>
                    <h3 className="text-xl font-bold text-black mb-4">{store.name}</h3>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-3 text-gray-600">
                        <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{store.address}</span>
                      </div>
                      {store.phone && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <Phone className="w-5 h-5 flex-shrink-0" />
                          <a href={`tel:${store.phone}`} className="hover:text-black">
                            {store.phone}
                          </a>
                        </div>
                      )}
                      {store.hours && (
                        <div className="flex items-start gap-3 text-gray-600">
                          <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span>{store.hours}</span>
                        </div>
                      )}
                    </div>
                    
                    {store.features && store.features.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {store.features.map((feature, idx) => (
                          <span key={idx} className="text-xs bg-gray-200 text-gray-700 px-2 py-1">
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {store.mapUrl ? (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        asChild
                        data-testid={`button-directions-${store.id}`}
                      >
                        <a href={store.mapUrl} target="_blank" rel="noopener noreferrer">
                          <Navigation className="w-4 h-4 mr-2" />
                          Get Directions
                        </a>
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          const query = encodeURIComponent(store.address);
                          window.open(`https://maps.google.com?q=${query}`, '_blank');
                        }}
                        data-testid={`button-directions-${store.id}`}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Get Directions
                      </Button>
                    )}
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Can't Visit a Store?</h2>
            <p className="text-xl leading-relaxed text-gray-200 mb-12">
              Shop online with free delivery on orders over £50 and easy returns within 30 days.
            </p>
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-black hover:bg-gray-100 px-12 py-6 text-lg font-semibold"
              data-testid="button-shop-online"
            >
              <a href="/shop-clean">Shop Online</a>
            </Button>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
