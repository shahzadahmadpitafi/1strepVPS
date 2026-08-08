import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Truck, Package, RotateCcw, MapPin, Clock, CreditCard, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function ShippingReturns() {
  const shippingOptions = [
    {
      icon: Truck,
      title: "Standard Delivery",
      time: "3-5 Business Days",
      cost: "£4.99",
      description: "Reliable delivery to your doorstep"
    },
    {
      icon: Package,
      title: "Express Delivery",
      time: "1-2 Business Days",
      cost: "£9.99",
      description: "Fast tracked delivery service"
    },
    {
      icon: MapPin,
      title: "Free Standard Shipping",
      time: "3-5 Business Days",
      cost: "Free on orders over £50",
      description: "No minimum on Express"
    }
  ];

  const returnSteps = [
    {
      step: "1",
      title: "Initiate Return",
      description: "Log into your account and select the items you wish to return from your order history"
    },
    {
      step: "2",
      title: "Print Label",
      description: "Print your prepaid return label from your account or contact our support team"
    },
    {
      step: "3",
      title: "Pack Items",
      description: "Pack items securely in original packaging with all tags attached"
    },
    {
      step: "4",
      title: "Ship Back",
      description: "Drop off at any Royal Mail location or arrange a collection"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-card border-b border-card-border">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <Button variant="ghost" size="sm" asChild className="mb-6" data-testid="button-back-to-shop">
              <Link href="/shop-clean">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shop
              </Link>
            </Button>
            <div className="text-center">
              <Truck className="w-16 h-16 text-primary mx-auto mb-6" />
              <h1 className="text-5xl font-bold mb-4" data-testid="heading-shipping-returns">
                Shipping & Returns
              </h1>
              <p className="text-xl text-muted-foreground">
                Fast, reliable delivery with hassle-free returns
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Shipping Options */}
          <div>
            <h2 className="text-3xl font-bold mb-6">Delivery Options</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {shippingOptions.map((option, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <option.icon className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{option.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{option.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <CreditCard className="w-4 h-4" />
                      <span>{option.cost}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pt-2">
                      {option.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
              <CardDescription>Important details about your delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Processing Time</h4>
                  <p className="text-sm text-muted-foreground">
                    Orders are processed within 1-2 business days. You'll receive a confirmation email once your order ships.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Delivery Areas</h4>
                  <p className="text-sm text-muted-foreground">
                    We currently deliver throughout the UK. International shipping coming soon.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Order Tracking</h4>
                  <p className="text-sm text-muted-foreground">
                    Track your order anytime via your account dashboard or the tracking link in your confirmation email.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Signature Required</h4>
                  <p className="text-sm text-muted-foreground">
                    For orders over £100, signature confirmation is required for security.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Returns Policy */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <RotateCcw className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold">Returns Policy</h2>
            </div>
            
            <Card className="mb-6">
              <CardContent className="py-6">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">30 Days</div>
                    <p className="text-sm text-muted-foreground">Return window from delivery</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">Free</div>
                    <p className="text-sm text-muted-foreground">Return shipping in the UK</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">5-7 Days</div>
                    <p className="text-sm text-muted-foreground">Refund processing time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Return Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-sm text-muted-foreground">Items must be unworn, unwashed, and in original condition</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-sm text-muted-foreground">All tags must be attached</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-sm text-muted-foreground">Original packaging should be used when possible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-sm text-muted-foreground">Returns must be initiated within 30 days of delivery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-sm text-muted-foreground">Final sale items cannot be returned (marked as such at purchase)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Return Process */}
            <h3 className="text-2xl font-semibold mb-4">How to Return</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {returnSteps.map((step) => (
                <Card key={step.step}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {step.step}
                      </div>
                      <h4 className="font-semibold">{step.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Contact Section */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Need Help with Your Order?</h3>
                <p className="text-muted-foreground mb-4">
                  Our customer care team is ready to assist you
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <a 
                    href="/order-tracking" 
                    className="inline-flex items-center justify-center h-11 px-8 rounded-md bg-card border border-card-border font-medium hover-elevate active-elevate-2"
                    data-testid="link-track-order"
                  >
                    Track Order
                  </a>
                  <a 
                    href="/returns" 
                    className="inline-flex items-center justify-center h-11 px-8 rounded-md bg-card border border-card-border font-medium hover-elevate active-elevate-2"
                    data-testid="link-start-return"
                  >
                    Start a Return
                  </a>
                  <a 
                    href="/contact-support" 
                    className="inline-flex items-center justify-center h-11 px-8 rounded-md bg-primary text-primary-foreground font-medium hover-elevate active-elevate-2"
                    data-testid="link-contact-support"
                  >
                    Contact Support
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
