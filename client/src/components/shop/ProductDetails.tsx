import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Star,
  StarHalf,
  ShoppingCart,
  Heart,
  Check,
  Share2,
  Truck,
  RefreshCcw,
  Clock,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '@/lib/cart';
import { useToast } from '@/hooks/use-toast';
import ShareModal from './ShareModal';

interface ProductDetailsProps {
  productId: number;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ productId }) => {
  const [quantity, setQuantity] = useState(1);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: product, isLoading, error } = useQuery({
    queryKey: [`/api/products/${productId}`],
    suspense: false
  });

  // Fallback data for development
  const fallbackProduct = {
    id: Number(productId),
    name: 'OnePlus Nord CE 3 Lite 5G (8GB RAM, 128GB Storage)',
    description: 'Experience lightning-fast 5G connectivity with the OnePlus Nord CE 3 Lite. Featuring a powerful Snapdragon processor, 8GB RAM, and 128GB storage, this smartphone delivers smooth performance for all your daily tasks. The stunning 6.7-inch display with 120Hz refresh rate provides fluid visuals, while the 64MP main camera captures every detail with clarity.',
    price: 16999,
    originalPrice: 24999,
    discount: 32,
    images: [
      'https://images.unsplash.com/photo-1585060544812-6b45742d762f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1605236453806-6ff36851218e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.5,
    reviewCount: 2345,
    inStock: true,
    category: 'Smartphones',
    highlights: [
      '6.7-inch 120Hz display',
      '64MP main camera',
      '5000mAh battery with 33W charging',
      'Snapdragon processor',
      'OxygenOS based on Android 13'
    ],
    specifications: {
      Display: '6.7-inch FHD+ LCD with 120Hz refresh rate',
      Processor: 'Qualcomm Snapdragon 695',
      RAM: '8GB LPDDR4X',
      Storage: '128GB UFS 2.2',
      Battery: '5000mAh with 33W SuperVOOC charging',
      'Rear Camera': '64MP main + 2MP macro + 2MP depth',
      'Front Camera': '16MP',
      OS: 'OxygenOS based on Android 13',
      'SIM Type': 'Dual SIM (nano + nano)',
      Connectivity: '5G, Wi-Fi 802.11, Bluetooth 5.1, GPS'
    }
  };

  // Use fallback data if still loading or error
  const displayProduct = product || fallbackProduct;
  
  // Calculate inStock property based on stock quantity
  // If the product has a stock property, use it to determine if in stock
  // Otherwise fallback to default inStock property
  const productWithStock = {
    ...displayProduct,
    inStock: displayProduct.stock !== undefined 
      ? displayProduct.stock > 0 
      : (displayProduct.inStock || false)
  };

  // Generate stars for rating
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(productWithStock.rating);
    const hasHalfStar = productWithStock.rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-5 w-5 fill-amber-400 text-amber-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-5 w-5 fill-amber-400 text-amber-400" />);
    }
    
    const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-star-${i}`} className="h-5 w-5 text-amber-400" />);
    }
    
    return stars;
  };

  const handleQuantityChange = (value: number) => {
    if (value >= 1) {
      setQuantity(value);
    }
  };

  const handleAddToCart = () => {
    addToCart({
      id: productWithStock.id,
      name: productWithStock.name,
      price: productWithStock.originalPrice,
      discountedPrice: productWithStock.price,
      image: productWithStock.images[0],
      quantity
    });
    
    toast({
      title: "Added to cart",
      description: `${productWithStock.name} has been added to your cart.`,
      duration: 3000
    });
  };
  
  const handleBuyNow = () => {
    // Check if the product is in stock before proceeding
    if (!productWithStock.inStock) {
      toast({
        title: "Product Unavailable",
        description: "This product is currently out of stock. You can add it to your wishlist to be notified when it's available.",
        variant: "destructive",
        duration: 5000
      });
      return;
    }
    
    // Add the product to cart
    addToCart({
      id: productWithStock.id,
      name: productWithStock.name,
      price: productWithStock.originalPrice,
      discountedPrice: productWithStock.price,
      image: productWithStock.images[0],
      quantity
    });
    
    // Redirect to checkout
    toast({
      title: "Proceeding to Checkout",
      description: "Taking you to checkout with your selected item.",
      duration: 2000
    });
    
    // Navigate to checkout page
    navigate('/checkout');
  };

  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <div className="bg-white rounded-lg p-4 mb-4 border border-neutral-200">
            <img 
              src={productWithStock.images[selectedImage]} 
              alt={productWithStock.name} 
              className="w-full h-80 object-contain"
              onError={(e) => {
                // Set a fallback image if the original fails to load
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loops
                target.src = "https://via.placeholder.com/400x400?text=Product+Image";
              }}
            />
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {productWithStock.images.map((image, index) => (
              <div 
                key={index} 
                className={`bg-white rounded border p-2 cursor-pointer ${selectedImage === index ? 'border-secondary' : 'border-neutral-200'}`}
                onClick={() => setSelectedImage(index)}
              >
                <img 
                  src={image} 
                  alt={`${productWithStock.name} - Image ${index + 1}`}
                  className="w-full h-16 object-contain" 
                  onError={(e) => {
                    // Set a fallback image if the original fails to load
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // Prevent infinite loops
                    target.src = "https://via.placeholder.com/100x100?text=Thumbnail";
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Product Info */}
        <div>
          <h1 className="text-2xl font-semibold mb-2 text-neutral-800">{productWithStock.name}</h1>
          
          <div className="flex items-center mb-4">
            <div className="flex">
              {renderStars()}
            </div>
            <span className="text-sm text-neutral-500 ml-2">({productWithStock.reviewCount} reviews)</span>
            <span className="mx-2 text-neutral-300">|</span>
            {productWithStock.inStock ? (
              <span className="text-green-600 flex items-center text-sm">
                <Check className="h-4 w-4 mr-1" /> In Stock
              </span>
            ) : (
              <span className="text-red-500 text-sm">Out of Stock</span>
            )}
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-1">
              <span className="text-2xl font-bold text-neutral-800">₹{(productWithStock.price/100).toLocaleString('en-IN')}</span>
              <span className="text-lg text-neutral-500 line-through ml-2">₹{(productWithStock.originalPrice/100).toLocaleString('en-IN')}</span>
              <span className="ml-2 text-sm bg-accent text-white px-2 py-0.5 rounded">
                {productWithStock.discount}% off
              </span>
            </div>
            <p className="text-xs text-neutral-500">Inclusive of all taxes</p>
          </div>
          
          <div className="mb-6">
            <p className="text-neutral-600 mb-4">{productWithStock.description}</p>
            
            <ul className="space-y-1 mb-4">
              {productWithStock.highlights.map((highlight, index) => (
                <li key={index} className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span className="text-sm">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200 mb-6">
            <div className="flex items-center text-sm mb-2">
              <Truck className="h-4 w-4 text-secondary mr-2" />
              <span>Free shipping on orders above ₹499</span>
            </div>
            <div className="flex items-center text-sm mb-2">
              <RefreshCcw className="h-4 w-4 text-secondary mr-2" />
              <span>7-day easy returns</span>
            </div>
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 text-secondary mr-2" />
              <span>Delivered in 3-7 business days</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center border border-neutral-300 rounded-md">
              <Button 
                type="button" 
                variant="ghost" 
                className="h-10 px-3 rounded-r-none" 
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <span className="w-10 text-center">{quantity}</span>
              <Button 
                type="button" 
                variant="ghost" 
                className="h-10 px-3 rounded-l-none"
                onClick={() => handleQuantityChange(quantity + 1)}
              >
                +
              </Button>
            </div>
            
            <Button 
              onClick={handleAddToCart}
              className="bg-secondary hover:bg-secondary-dark text-white"
              disabled={!productWithStock.inStock}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
            
            <Button 
              onClick={handleBuyNow}
              className="bg-primary hover:bg-primary-dark text-white"
              disabled={!productWithStock.inStock}
              size="lg"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Buy Now
            </Button>
            
            <Button variant="outline" size="icon" className="rounded-full">
              <Heart className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full"
              onClick={() => setShareModalOpen(true)}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Share Modal */}
          <ShareModal 
            open={shareModalOpen}
            onOpenChange={setShareModalOpen}
            productName={productWithStock.name}
            productUrl={`${window.location.origin}/product/${productId}`}
          />
        </div>
      </div>
      
      {/* Tabs for Details/Specs/Reviews */}
      <div className="mt-8">
        <Tabs defaultValue="specifications">
          <TabsList className="w-full bg-neutral-100 p-0 rounded-md">
            <TabsTrigger value="specifications" className="flex-1 py-3">Specifications</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 py-3">Reviews</TabsTrigger>
            <TabsTrigger value="shipping" className="flex-1 py-3">Shipping & Returns</TabsTrigger>
          </TabsList>
          
          <TabsContent value="specifications" className="bg-white p-6 rounded-md mt-4 border border-neutral-200">
            <h3 className="font-medium text-lg mb-4">Technical Specifications</h3>
            <div className="space-y-2">
              {Object.entries(productWithStock.specifications).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 py-2 border-b border-neutral-100">
                  <div className="font-medium text-neutral-700">{key}</div>
                  <div className="col-span-2 text-neutral-600">{value}</div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="shipping" className="bg-white p-6 rounded-md mt-4 border border-neutral-200">
            <h3 className="font-medium text-lg mb-4">Shipping & Returns</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-base mb-2 flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-secondary" />
                  Free Delivery Across India
                </h4>
                <p className="text-neutral-600 text-sm ml-7">
                  We offer free shipping on all orders across India. Your order will typically be delivered within 3-7 business days.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-base mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  7-Day Return Policy
                </h4>
                <p className="text-neutral-600 text-sm ml-7">
                  If you're not satisfied with your purchase, you can return it within 7 days for a full refund or exchange. The product must be in its original condition and packaging.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-base mb-2 flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2 text-secondary" />
                  Quality Guarantee
                </h4>
                <p className="text-neutral-600 text-sm ml-7">
                  All our products are thoroughly inspected and tested before shipping to ensure high quality standards.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reviews" className="bg-white p-6 rounded-md mt-4 border border-neutral-200">
            <div className="flex items-center mb-6">
              <div className="bg-neutral-100 rounded-full w-16 h-16 flex items-center justify-center mr-4">
                <span className="text-2xl font-bold">{productWithStock.rating}</span>
              </div>
              <div>
                <div className="flex mb-1">
                  {renderStars()}
                </div>
                <p className="text-sm text-neutral-500">Based on {productWithStock.reviewCount} reviews</p>
              </div>
            </div>
            
            <div className="border-t border-neutral-200 pt-4">
              <p className="text-center text-neutral-500">Customer reviews will be displayed here.</p>
            </div>
          </TabsContent>
          

        </Tabs>
      </div>
    </div>
  );
};

export default ProductDetails;
