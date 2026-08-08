import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function PaymentConfirmed() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">Payment Received</h1>
          <p className="text-muted-foreground">
            Thank you for your payment. Your order has been confirmed and is being processed.
          </p>
          <p className="text-sm text-muted-foreground">
            You can safely close this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
