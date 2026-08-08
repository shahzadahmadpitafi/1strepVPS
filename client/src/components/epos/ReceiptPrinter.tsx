import { forwardRef, useImperativeHandle } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Printer, Download, Mail, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ReceiptItem {
  name: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

interface ReceiptData {
  orderNumber: string;
  terminalId: string;
  timestamp: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  customerEmail?: string;
  terminalName?: string;
}

interface ReceiptPrinterProps {
  data: ReceiptData;
  onPrintComplete?: () => void;
  onEmailComplete?: () => void;
}

interface ReceiptPrinterHandle {
  printReceipt: () => Promise<void>;
}

const ReceiptPrinter = forwardRef<ReceiptPrinterHandle, ReceiptPrinterProps>(
  ({ data, onPrintComplete, onEmailComplete }, ref) => {
  useImperativeHandle(ref, () => ({
    printReceipt: async () => {
      await performPrint();
    },
  }));
  const generateReceiptHTML = (): string => {
    const thermallWidth = 80; // Standard thermal printer width in mm (approx 300px)

    return `
      <div style="width: 300px; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4;">
        <div style="text-align: center; border-bottom: 2px dashed #000; padding: 10px 0;">
          <h1 style="margin: 0; font-size: 18px; font-weight: bold;">1stRep</h1>
          <p style="margin: 5px 0 0 0; font-size: 10px;">Premium Fitness Apparel</p>
        </div>

        <div style="border-bottom: 2px dashed #000; padding: 10px 0;">
          <p style="margin: 0;"><strong>Order:</strong> ${data.orderNumber}</p>
          <p style="margin: 5px 0 0 0;"><strong>Terminal:</strong> ${data.terminalName || data.terminalId}</p>
          <p style="margin: 5px 0 0 0; font-size: 11px;">${data.timestamp}</p>
        </div>

        <div style="border-bottom: 2px dashed #000; padding: 10px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tbody>
              ${data.items
                .map(
                  (item) => `
                <tr>
                  <td style="text-align: left; padding: 5px 0;">
                    <strong>${item.name}</strong><br/>
                    ${item.size ? `Size: ${item.size}` : ""}${
                    item.size && item.color ? " | " : ""
                  }${item.color ? `Colour: ${item.color}` : ""}<br/>
                    Qty: ${item.quantity} × ${formatCurrency(parseFloat(item.unitPrice))}
                  </td>
                  <td style="text-align: right; padding: 5px 0; vertical-align: top;">
                    <strong>${formatCurrency(parseFloat(item.totalPrice))}</strong>
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div style="border-bottom: 2px dashed #000; padding: 10px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Subtotal:</span>
            <strong>${formatCurrency(data.subtotal)}</strong>
          </div>
          ${
            data.discount > 0
              ? `<div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: green;">
            <span>Discount:</span>
            <strong>-${formatCurrency(data.discount)}</strong>
          </div>`
              : ""
          }
          ${
            data.tax > 0
              ? `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Tax (20%):</span>
            <strong>${formatCurrency(data.tax)}</strong>
          </div>`
              : ""
          }
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold;">
            <span>TOTAL:</span>
            <span>${formatCurrency(data.total)}</span>
          </div>
        </div>

        <div style="border-bottom: 2px dashed #000; padding: 10px 0;">
          <p style="margin: 0;"><strong>Payment:</strong> ${data.paymentMethod}</p>
          <p style="margin: 5px 0 0 0; font-size: 10px;">Amount Paid: ${formatCurrency(data.total)}</p>
        </div>

        <div style="text-align: center; padding: 10px 0;">
          <p style="margin: 0; font-size: 10px;">Thank you for your purchase!</p>
          <p style="margin: 5px 0 0 0; font-size: 10px;">Built by Qanzak Global</p>
          <p style="margin: 5px 0 0 0; font-size: 9px; color: #666;">www.1strep.co.uk</p>
        </div>
      </div>
    `;
  };

  const performPrint = async () => {
    try {
      // Create temporary container
      const container = document.createElement("div");
      container.innerHTML = generateReceiptHTML();
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      // Convert to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Clean up
      document.body.removeChild(container);

      // Print
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(
          `<img src="${canvas.toDataURL()}" style="width:100%;">`
        );
        printWindow.document.close();
        printWindow.print();
      }

      onPrintComplete?.();
    } catch (error) {
      console.error("Print failed:", error);
    }
  };

  const downloadReceiptPDF = async () => {
    try {
      // Create temporary container
      const container = document.createElement("div");
      container.innerHTML = generateReceiptHTML();
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      // Convert to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Clean up
      document.body.removeChild(container);

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 200],
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, 80, 200);

      // Download
      pdf.save(`Receipt_${data.orderNumber}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
    }
  };

  const sendReceiptEmail = async () => {
    if (!data.customerEmail) {
      alert("No customer email provided");
      return;
    }

    try {
      // Create temporary container
      const container = document.createElement("div");
      container.innerHTML = generateReceiptHTML();
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      // Convert to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Clean up
      document.body.removeChild(container);

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 200],
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, 80, 200);

      // Convert to blob and send
      const pdfBlob = pdf.output("blob");

      // Call backend to send email
      const formData = new FormData();
      formData.append("email", data.customerEmail);
      formData.append("orderNumber", data.orderNumber);
      formData.append("receipt", pdfBlob);

      const response = await fetch("/api/epos/send-receipt", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        onEmailComplete?.();
      }
    } catch (error) {
      console.error("Email send failed:", error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">Receipt printing automatically...</span>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={performPrint}
          variant="outline"
          className="min-h-11"
          data-testid="button-print-receipt"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Again
        </Button>
        <Button
          onClick={downloadReceiptPDF}
          variant="outline"
          className="min-h-11"
          data-testid="button-download-receipt"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        {data.customerEmail && (
          <Button
            onClick={sendReceiptEmail}
            variant="outline"
            className="min-h-11"
            data-testid="button-email-receipt"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        )}
      </div>
    </div>
  );
  }
);

ReceiptPrinter.displayName = "ReceiptPrinter";

export default ReceiptPrinter;
