import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MessageCircle, Clock, MapPin, Send, CheckCircle2, Ticket, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ContactSupport() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    orderNumber: "",
    subject: "",
    message: ""
  });
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const { toast } = useToast();

  const submitTicketMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/support-tickets", {
        customerName: data.name,
        customerEmail: data.email,
        subject: data.subject,
        description: data.message,
        orderNumber: data.orderNumber || undefined
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSubmittedTicket(data.ticketNumber);
      toast({
        title: "Support Ticket Created",
        description: `Your ticket ${data.ticketNumber} has been submitted. We'll respond within 24 hours.`,
      });
      setFormData({
        name: "",
        email: "",
        orderNumber: "",
        subject: "",
        message: ""
      });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Unable to submit your request. Please try again or email us directly.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    submitTicketMutation.mutate(formData);
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      detail: "support@1strep.com",
      description: "Response within 24 hours",
      link: "mailto:support@1strep.com"
    },
    {
      icon: Phone,
      title: "Call Us",
      detail: "+44 20 1234 5678",
      description: "Mon-Fri, 9am-6pm GMT",
      link: "tel:+442012345678"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      detail: "Chat with our team",
      description: "Available during business hours",
      link: "#"
    }
  ];

  const popularTopics = [
    {
      title: "Order Status",
      description: "Track your order or check delivery status",
      link: "/order-tracking"
    },
    {
      title: "Returns & Exchanges",
      description: "Learn about our return policy",
      link: "/shipping-returns"
    },
    {
      title: "Size Guide",
      description: "Find your perfect fit",
      link: "/size-guide"
    },
    {
      title: "Product Information",
      description: "Questions about our products",
      link: "/faq"
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
              <MessageCircle className="w-16 h-16 text-primary mx-auto mb-6" />
              <h1 className="text-5xl font-bold mb-4" data-testid="heading-contact-support">
                Contact Support
              </h1>
              <p className="text-xl text-muted-foreground">
                We're here to help with any questions or concerns
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Contact Methods */}
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <Card key={index} className="hover-elevate">
                <CardContent className="pt-6">
                  <a href={method.link} className="block text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <method.icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-semibold mb-1">{method.title}</h3>
                    <p className="text-sm text-primary mb-1">{method.detail}</p>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you shortly
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submittedTicket ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Ticket Submitted!</h3>
                      <p className="text-muted-foreground mb-4">
                        Your support request has been received. We'll respond within 24 hours.
                      </p>
                      <div className="bg-card border border-card-border rounded-lg p-4 inline-block">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Ticket className="w-4 h-4" />
                          Your Ticket Number
                        </div>
                        <div className="text-2xl font-bold text-primary" data-testid="text-ticket-number">
                          {submittedTicket}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-4">
                        Please save this number for your reference.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setSubmittedTicket(null)}
                      data-testid="button-submit-another"
                    >
                      Submit Another Request
                    </Button>
                  </div>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Smith"
                      data-testid="input-name"
                      className="min-h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john.smith@example.com"
                      data-testid="input-email"
                      className="min-h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orderNumber">Order Number (Optional)</Label>
                    <Input
                      id="orderNumber"
                      value={formData.orderNumber}
                      onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                      placeholder="ORD-123456"
                      data-testid="input-order-number"
                      className="min-h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">
                      Subject <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) => setFormData({ ...formData, subject: value })}
                    >
                      <SelectTrigger data-testid="select-subject" className="min-h-11">
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Order Inquiry</SelectItem>
                        <SelectItem value="product">Product Question</SelectItem>
                        <SelectItem value="return">Returns & Exchanges</SelectItem>
                        <SelectItem value="shipping">Shipping Question</SelectItem>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Message <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us how we can help..."
                      rows={6}
                      data-testid="input-message"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    data-testid="button-submit"
                    disabled={submitTicketMutation.isPending}
                  >
                    {submitTicketMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
                )}
              </CardContent>
            </Card>

            {/* Popular Topics & Business Hours */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Popular Topics</CardTitle>
                  <CardDescription>Quick links to common questions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {popularTopics.map((topic, index) => (
                    <a 
                      key={index} 
                      href={topic.link}
                      className="block p-4 rounded-lg border border-card-border hover-elevate active-elevate-2"
                      data-testid={`link-topic-${index}`}
                    >
                      <h4 className="font-semibold mb-1">{topic.title}</h4>
                      <p className="text-sm text-muted-foreground">{topic.description}</p>
                    </a>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <CardTitle>Business Hours</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Monday - Friday</span>
                    <span className="text-sm font-medium">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Saturday</span>
                    <span className="text-sm font-medium">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Sunday</span>
                    <span className="text-sm font-medium">Closed</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    All times in GMT. Email support available 24/7 with response within 24 hours.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <CardTitle>Our Location</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">1stRep UK Headquarters</p>
                  <p className="text-sm text-muted-foreground">
                    123 Performance Street<br />
                    London, E1 6AN<br />
                    United Kingdom
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
