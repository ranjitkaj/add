import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart';
import { useToast } from '@/hooks/use-toast';
import { Calculator, CreditCard, TruckIcon } from 'lucide-react';

interface CartSummaryProps {
  showCheckoutButton?: boolean;
}

const CartSummary: React.FC<CartSummaryProps> = ({ showCheckoutButton = true }) => {
  const { cartItems, totalPrice } = useCart();
  const { toast } = useToast();
  
  // Calculate subtotal (free shipping for all orders)
  const subtotal = totalPrice / 100;
  const shipping = 0; // Always free shipping
  const total = subtotal + shipping;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2">Order Summary</h2>
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Subtotal ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
          <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Shipping Fee</span>
          {shipping > 0 ? (
            <span className="font-medium">₹{shipping.toLocaleString('en-IN')}</span>
          ) : (
            <span className="text-green-600 font-medium">Free</span>
          )}
        </div>
        
        <div className="text-xs text-green-600 pt-1">
          <TruckIcon className="h-3.5 w-3.5 inline mr-1" />
          <span>Free delivery all across India</span>
        </div>
      </div>
      
      <div className="border-t border-dashed pt-3 mb-4">
        <div className="flex justify-between font-semibold">
          <span>Total Amount</span>
          <span className="text-lg">₹{total.toLocaleString('en-IN')}</span>
        </div>
      </div>
      
      {showCheckoutButton && (
        <Link href="/checkout">
          <Button 
            className="w-full bg-secondary hover:bg-secondary-dark text-white"
            onClick={(e) => {
              // Check if any items are out of stock
              const outOfStockItems = cartItems.filter(item => 
                item.product?.stock <= 0
              );
              
              if (outOfStockItems.length > 0) {
                e.preventDefault();
                
                // Get names of out of stock items
                const itemNames = outOfStockItems.map(item => item.product.name);
                const message = itemNames.length === 1 
                  ? `"${itemNames[0]}" is out of stock.`
                  : `The following items are out of stock: ${itemNames.join(', ')}`;
                
                toast({
                  title: "Some items are unavailable",
                  description: message + " Please remove them from your cart to continue.",
                  variant: "destructive",
                  duration: 5000
                });
              }
            }}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Proceed to Checkout
          </Button>
        </Link>
      )}
      
      {/* Payment methods */}
      <div className="mt-4 text-center text-xs text-neutral-500">
        <p className="mb-2">We accept:</p>
        <div className="flex justify-center space-x-2">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-6 bg-white rounded p-0.5" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6 bg-white rounded p-0.5" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/512px-Paytm_Logo_%28standalone%29.svg.png" alt="Paytm" className="h-6 bg-white rounded p-0.5" />
          <img src="https://razorpay.com/favicon.png" alt="Razorpay" className="h-6 bg-white rounded p-0.5" />
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
