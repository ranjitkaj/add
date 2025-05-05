import { format } from "date-fns";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Interface for order and order item
interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  productName: string;
  productImage?: string;
}

interface Order {
  id: number;
  userId: number;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  // shippingAddress: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  city: string;
  state: string;
  pincode: string;
  phoneNumber: string;
  trackingId?: string;
  items: OrderItem[];
}

export const createPDF = async (order: Order): Promise<void> => {
  try {
    console.log("Starting invoice generation for order:", order?.id);

    // Validation
    if (!order || !order.id || !Array.isArray(order.items)) {
      throw new Error("Invalid order data");
    }

    // Format dates
    let dateCreated, dateGenerated;
    try {
      dateCreated = format(new Date(order.createdAt), "dd MMM yyyy");
      dateGenerated = format(new Date(), "dd MMM yyyy");
    } catch (err) {
      dateCreated = "N/A";
      dateGenerated = format(new Date(), "dd MMM yyyy");
    }

    // Calculate total amount (divide by 100 since it's stored in paise)
    const totalAmount =
      typeof order.totalAmount === "number" ? order.totalAmount : 0;
    const convertedTotal = totalAmount / 100;

    // Create a temporary HTML invoice
    const invoiceHtml = document.createElement("div");
    invoiceHtml.style.width = "800px";
    invoiceHtml.style.padding = "40px";
    invoiceHtml.style.fontFamily = "Arial, sans-serif";
    invoiceHtml.style.color = "#212121";
    invoiceHtml.style.position = "absolute";
    invoiceHtml.style.left = "-9999px";
    invoiceHtml.style.background = "white";

    // Header
    invoiceHtml.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <h1 style="font-size: 28px; margin: 0; color: #212121;">BLINKEACH</h1>
          <p style="font-size: 14px; color: #666; margin: 5px 0;">India's favorite shopping destination</p>
        </div>
        <div style="text-align: right;">
          <h2 style="font-size: 24px; color: #0066CC; margin: 0;">INVOICE</h2>
          <p style="margin: 5px 0;">GSTIN: SAMPLE123456789</p>
          <p style="margin: 5px 0;">Invoice #: BLK-${order.id}-${format(new Date(), "yyyyMMdd")}</p>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <p style="margin: 5px 0;"><strong>Order #:</strong> ${order.id}</p>
          <p style="margin: 5px 0;"><strong>Date Created:</strong> ${dateCreated}</p>
          <p style="margin: 5px 0;"><strong>Date Generated:</strong> ${dateGenerated}</p>
          <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod}</p>
          <div style="margin-top: 10px; display: inline-block; padding: 5px 10px; border-radius: 3px; font-size: 12px; text-transform: uppercase; background-color: ${getStatusBgColor(order.status)}; color: white;">
            ${order.status}
          </div>
        </div>
        <div>
          <h3 style="font-size: 16px; color: #0066CC; margin-bottom: 5px;">Shipped To:</h3>
          <p style="margin: 5px 0;">${order.shippingAddress || "N/A"}</p>
          <p style="margin: 5px 0;">${order.city || "N/A"}, ${order.state || "N/A"} - ${order.pincode || "N/A"}</p>
          <p style="margin: 5px 0;">Phone: ${order.shippingAddress.phone || "N/A"}</p>
          ${order.trackingId ? `<p style="margin: 5px 0;">Tracking ID: ${order.trackingId}</p>` : ""}
        </div>
      </div>
      
      <hr style="border: none; height: 1px; background-color: #e0e0e0; margin: 20px 0;">
      
      <h3 style="margin: 20px 0; font-size: 18px;">Order Items</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0;">Item</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e0e0e0;">Qty</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e0e0e0;">Unit Price</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e0e0e0;">Total</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Add order items
    order.items.forEach((item) => {
      try {
        const itemPrice =
          (typeof item.price === "number" ? item.price : 0) / 100;
        const itemQuantity =
          typeof item.quantity === "number" ? item.quantity : 1;

        invoiceHtml.innerHTML += `
          <tr>
            <td style="padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0;">${item.productName || "Unknown Product"}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e0e0e0;">${itemQuantity}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e0e0e0;">₹${itemPrice.toFixed(2)}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e0e0e0;">₹${(itemPrice * itemQuantity).toFixed(2)}</td>
          </tr>
        `;
      } catch (err) {
        console.error("Error processing item for invoice:", err);
      }
    });

    // Add totals and footer
    invoiceHtml.innerHTML += `
        </tbody>
      </table>
      
      <div style="margin-top: 20px; text-align: right;">
        <div style="display: inline-block; width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 5px 0;">
            <span>Subtotal:</span>
            <span>₹${convertedTotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 5px 0;">
            <span>Shipping:</span>
            <span>Free</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 0; font-weight: bold; font-size: 18px; border-top: 1px solid #e0e0e0;">
            <span>Total:</span>
            <span>₹${convertedTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <hr style="border: none; height: 1px; background-color: #e0e0e0; margin: 30px 0 20px;">
      
      <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
        <p style="margin: 5px 0;">Thank you for shopping with Blinkeach!</p>
        <p style="margin: 5px 0;">For any queries, please contact our customer support at support@blinkeach.com</p>
      </div>
    `;

    // Append to document
    document.body.appendChild(invoiceHtml);

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(invoiceHtml, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Remove the temporary HTML element
      document.body.removeChild(invoiceHtml);

      // Create PDF from canvas
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio,
      );

      // Save the PDF
      pdf.save(`Blinkeach_Invoice_Order_${order.id}.pdf`);
      console.log("Invoice generated successfully for order:", order.id);
    } catch (error) {
      // If still in document, remove the temporary element
      if (document.body.contains(invoiceHtml)) {
        document.body.removeChild(invoiceHtml);
      }
      console.error("Error generating PDF:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw error;
  }
};

// Helper function to get status background color for HTML
function getStatusBgColor(status: string): string {
  switch (status?.toLowerCase()) {
    case "pending":
      return "#ff9800";
    case "processing":
      return "#2196f3";
    case "shipped":
      return "#673ab7";
    case "delivered":
      return "#4caf50";
    case "cancelled":
      return "#f44336";
    default:
      return "#9e9e9e";
  }
}
