import HeaderClean from '@/components/HeaderClean';
import ScrollReveal from '@/components/ScrollReveal';
import { BookOpen, Clock, User, ChevronRight, Search, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';

export default function Blog() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Training", "Nutrition", "Style", "Community", "Product"];

  const featuredPost = {
    title: "The Science Behind Our Performance Fabrics",
    excerpt: "Discover how 1stRep engineers moisture-wicking, anti-odour, and compression technologies into every garment.",
    author: "James Mitchell",
    date: "December 10, 2024",
    readTime: "8 min read",
    category: "Product",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1200"
  };

  const blogPosts = [
    {
      title: "5 Morning Routines of Elite Athletes",
      excerpt: "Learn how professional athletes structure their mornings for peak performance.",
      author: "Sarah Thompson",
      date: "December 5, 2024",
      readTime: "5 min read",
      category: "Training",
      image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
    },
    {
      title: "Sustainable Fitness: Our 2025 Goals",
      excerpt: "How 1stRep is working towards carbon neutrality and circular fashion.",
      author: "Emma Green",
      date: "November 28, 2024",
      readTime: "6 min read",
      category: "Community",
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600"
    },
    {
      title: "What to Eat Before Your Workout",
      excerpt: "Nutritionist-approved pre-workout meals to fuel your training sessions.",
      author: "Dr. Michael Chen",
      date: "November 20, 2024",
      readTime: "7 min read",
      category: "Nutrition",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=600"
    },
    {
      title: "Gym to Street: Styling Your Activewear",
      excerpt: "How to transition your workout gear into everyday fashion looks.",
      author: "Lisa Park",
      date: "November 15, 2024",
      readTime: "4 min read",
      category: "Style",
      image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600"
    },
    {
      title: "Behind the Design: Spring 2025 Collection",
      excerpt: "An exclusive look at the inspiration behind our upcoming collection.",
      author: "Design Team",
      date: "November 10, 2024",
      readTime: "6 min read",
      category: "Product",
      image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?q=80&w=600"
    },
    {
      title: "Recovery Day Essentials",
      excerpt: "The importance of rest days and how to make the most of them.",
      author: "Coach David",
      date: "November 5, 2024",
      readTime: "5 min read",
      category: "Training",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600"
    }
  ];

  const filteredPosts = activeCategory === "All" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === activeCategory);

  return (
    <div className="min-h-screen bg-white">
      <HeaderClean />
      
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto py-20">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 mb-6 px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-semibold tracking-wider uppercase">
              <BookOpen className="w-4 h-4" />
              Blog
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight" data-testid="blog-heading">
              The 1stRep Journal
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <p className="text-xl md:text-2xl font-light leading-relaxed max-w-3xl mx-auto text-gray-200">
              Training tips, product insights, and stories from our community.
            </p>
          </ScrollReveal>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      <section className="py-8 px-4 bg-white border-b">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className={activeCategory === category ? "bg-black" : ""}
                  data-testid={`category-${category.toLowerCase()}`}
                >
                  {category}
                </Button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search articles..." 
                className="pl-10"
                data-testid="input-search-blog"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="bg-gray-50 overflow-hidden flex flex-col lg:flex-row">
              <div className="lg:w-1/2">
                <img 
                  src={featuredPost.image} 
                  alt={featuredPost.title}
                  className="w-full h-64 lg:h-full object-cover"
                />
              </div>
              <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                <Badge variant="secondary" className="w-fit mb-4">{featuredPost.category}</Badge>
                <h2 className="text-3xl lg:text-4xl font-bold text-black mb-4">{featuredPost.title}</h2>
                <p className="text-gray-600 text-lg mb-6">{featuredPost.excerpt}</p>
                
                <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {featuredPost.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {featuredPost.readTime}
                  </div>
                </div>
                
                <Button className="bg-black text-white hover:bg-gray-800 w-fit">
                  Read Article
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold mb-12 text-black">Latest Articles</h2>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <div className="bg-white overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="relative overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge variant="secondary" className="absolute top-4 left-4">
                      {post.category}
                    </Badge>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-black mb-3 group-hover:text-gray-700 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{post.author}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
          
          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No articles found in this category.</p>
            </div>
          )}
          
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" data-testid="button-load-more">
              Load More Articles
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <Tag className="w-16 h-16 mx-auto mb-8 opacity-80" />
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Want to Contribute?</h2>
            <p className="text-xl leading-relaxed text-gray-200 mb-12">
              We're always looking for guest writers. Share your expertise with our community.
            </p>
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-black hover:bg-gray-100 px-12 py-6 text-lg font-semibold"
              data-testid="button-submit-article"
            >
              <a href="mailto:blog@1strep.com">Submit Your Article</a>
            </Button>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}