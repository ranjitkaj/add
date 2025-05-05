import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ProductGrid from '@/components/shop/ProductGrid';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const CategoryProductsSection: React.FC = () => {
  // Fetch all products
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products', { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      return response.json();
    }
  });

  return (
    <section className="py-8 px-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">All Products</h2>
        <Link href="/shop">
          <Button variant="outline" className="text-secondary border-secondary hover:bg-secondary/10">
            View All
          </Button>
        </Link>
      </div>
      
      <ProductGrid 
        products={products || []} 
        isLoading={isLoading}
        gridCols={4}
      />
    </section>
  );
};

export default CategoryProductsSection;