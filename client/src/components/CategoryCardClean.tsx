interface CategoryCardCleanProps {
  name: string;
  image: string;
  onClick?: () => void;
}

export default function CategoryCardClean({ name, image, onClick }: CategoryCardCleanProps) {
  return (
    <button
      onClick={() => {
        onClick?.();
      }}
      className="relative group overflow-hidden rounded-md aspect-square hover-elevate"
      data-testid={`card-category-clean-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <img
        src={image}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <h3 className="absolute bottom-6 left-6 text-2xl font-bold text-white tracking-tight" data-testid={`text-category-clean-${name.toLowerCase().replace(/\s+/g, '-')}`}>
        {name}
      </h3>
    </button>
  );
}
