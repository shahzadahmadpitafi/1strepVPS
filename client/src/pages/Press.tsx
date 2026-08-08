import HeaderClean from '@/components/HeaderClean';
import ScrollReveal from '@/components/ScrollReveal';
import { Newspaper, Download, Mail, ExternalLink, Calendar, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';

export default function Press() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const pressReleases = [
    {
      date: "December 2024",
      title: "1stRep Announces Carbon Neutral Shipping Initiative",
      excerpt: "Leading activewear brand commits to offsetting 100% of shipping emissions by Q1 2025.",
      category: "Sustainability"
    },
    {
      date: "November 2024",
      title: "1stRep Partners with UK Athletics Federation",
      excerpt: "Official apparel partnership to support British athletes in international competitions.",
      category: "Partnership"
    },
    {
      date: "October 2024",
      title: "New Manchester Flagship Store Opening",
      excerpt: "1stRep opens its largest retail location featuring innovative try-on technology.",
      category: "Retail"
    },
    {
      date: "September 2024",
      title: "1stRep Reaches 50,000 Active Community Members",
      excerpt: "Milestone achievement highlights the brand's growing global athlete community.",
      category: "Milestone"
    },
    {
      date: "August 2024",
      title: "Launch of Recycled Performance Collection",
      excerpt: "New product line made entirely from recycled ocean plastics and post-consumer materials.",
      category: "Product"
    }
  ];

  const mediaFeatures = [
    { outlet: "The Guardian", title: "The Rise of Sustainable Activewear", date: "Nov 2024" },
    { outlet: "GQ UK", title: "Best Gym Wear Brands 2024", date: "Oct 2024" },
    { outlet: "Men's Health", title: "Training Gear That Actually Works", date: "Sep 2024" },
    { outlet: "Drapers", title: "UK Activewear Brands to Watch", date: "Aug 2024" }
  ];

  const stats = [
    { number: "50K+", label: "Community Members" },
    { number: "15", label: "Countries Shipped" },
    { number: "100+", label: "Products" },
    { number: "4.9★", label: "Customer Rating" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <HeaderClean />
      
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto py-20">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 mb-6 px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-semibold tracking-wider uppercase">
              <Newspaper className="w-4 h-4" />
              Press Room
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight" data-testid="press-heading">
              Press & Media
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <p className="text-xl md:text-2xl font-light leading-relaxed max-w-3xl mx-auto text-gray-200">
              The latest news, announcements, and media resources from 1stRep.
            </p>
          </ScrollReveal>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      <section className="py-16 px-4 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                  <div className="text-gray-400 text-sm uppercase tracking-wider">{stat.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Latest</div>
              <h2 className="text-5xl font-bold mb-6 text-black">Press Releases</h2>
            </div>
          </ScrollReveal>
          
          <div className="space-y-6">
            {pressReleases.map((release, index) => (
              <ScrollReveal key={index} delay={index * 0.05}>
                <div className="bg-gray-50 p-8 hover:bg-gray-100 transition-colors group cursor-pointer">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="outline">{release.category}</Badge>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {release.date}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-black mb-2 group-hover:text-gray-700">{release.title}</h3>
                      <p className="text-gray-600">{release.excerpt}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      <ExternalLink className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Coverage</div>
              <h2 className="text-5xl font-bold mb-6 text-black">In the Media</h2>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 gap-6">
            {mediaFeatures.map((feature, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <div className="bg-white p-6 shadow-sm flex items-center gap-4">
                  <Quote className="w-8 h-8 text-gray-300 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">{feature.outlet} • {feature.date}</div>
                    <h3 className="text-lg font-semibold text-black">{feature.title}</h3>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400" />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="bg-gray-900 text-white p-12 text-center">
              <Download className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl font-bold mb-4">Media Kit</h2>
              <p className="text-gray-300 mb-8 max-w-xl mx-auto">
                Download our press kit containing brand assets, logos, product images, and company information.
              </p>
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 px-8"
                data-testid="button-download-media-kit"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Media Kit
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <Mail className="w-16 h-16 mx-auto mb-8 opacity-80" />
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Media Enquiries</h2>
            <p className="text-xl leading-relaxed text-gray-200 mb-12">
              For press enquiries, interview requests, or media partnerships, please contact our communications team.
            </p>
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-black hover:bg-gray-100 px-12 py-6 text-lg font-semibold"
              data-testid="button-contact-press"
            >
              <a href="mailto:press@1strep.com">press@1strep.com</a>
            </Button>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}