import ProductCard from '../ProductCard'

// Product image will be loaded from database
const productImage = '';

export default function ProductCardExample() {
  return (
    <div className="max-w-sm">
      <ProductCard
        id="1"
        name="Performance T-Shirt"
        price={35.00}
        originalPrice={45.00}
        image={productImage}
        category="Men's Apparel"
        isNew={true}
        colors={['#000000', '#333333', '#666666']}
        sizes={['S', 'M', 'L', 'XL']}
      />
    </div>
  )
}