import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';

interface AnimatedCategoryCardProps {
  title: string;
  image: string;
  link: string;
  description?: string;
}

export default function AnimatedCategoryCard({
  title,
  image,
  link,
  description
}: AnimatedCategoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={link} data-testid={`link-category-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div
        className="group relative h-[400px] rounded-md overflow-hidden cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid={`category-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <img
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        
        <div className={`absolute inset-0 bg-gradient-to-t transition-all duration-500 ${
          isHovered 
            ? 'from-black/80 via-black/50 to-black/20' 
            : 'from-black/40 via-black/10 to-transparent'
        }`} />

        <div className={`absolute inset-0 flex items-end p-8 transition-all duration-500 ${
          isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-80'
        }`}>
          <div className="text-white w-full">
            <h3 className="text-3xl font-bold mb-2 transform transition-transform duration-500 group-hover:-translate-y-1">
              {title}
            </h3>
            
            {description && (
              <p className={`text-white/90 mb-4 text-sm transition-all duration-500 delay-75 ${
                isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
                {description}
              </p>
            )}
            
            <div className={`flex items-center gap-2 font-medium transition-all duration-500 delay-100 ${
              isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            }`}>
              <span className="border-b-2 border-white pb-1">Explore Collection</span>
              <ArrowRight className={`w-5 h-5 transition-transform duration-500 ${
                isHovered ? 'translate-x-1' : 'translate-x-0'
              }`} />
            </div>
          </div>
        </div>

        <div className={`absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium transition-all duration-500 ${
          isHovered ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'
        }`}>
          {title}
        </div>
      </div>
    </Link>
  );
}
