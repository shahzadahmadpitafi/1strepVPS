import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HelpCircle, Search, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqCategories = [
    {
      category: "Orders & Payments",
      questions: [
        {
          q: "What payment methods do you accept?",
          a: "We accept all major credit and debit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, and Google Pay. All transactions are processed securely."
        },
        {
          q: "Can I modify or cancel my order?",
          a: "Orders can be modified or cancelled within 1 hour of placement. After this, the order enters our fulfilment system. Please contact support immediately if you need to make changes."
        },
        {
          q: "Do you offer gift cards?",
          a: "Yes, we offer digital gift cards in various denominations. They can be purchased on our website and are delivered instantly via email."
        },
        {
          q: "Why was my payment declined?",
          a: "Payment declines can happen for various reasons: insufficient funds, incorrect card details, or your bank's fraud protection. Please verify your details or contact your bank."
        }
      ]
    },
    {
      category: "Shipping & Delivery",
      questions: [
        {
          q: "How long does shipping take?",
          a: "Standard delivery takes 3-5 business days, while Express delivery takes 1-2 business days. Free standard shipping is available on orders over £50."
        },
        {
          q: "Do you ship internationally?",
          a: "Currently, we ship within the UK only. International shipping is coming soon. Sign up for our newsletter to be notified when we expand."
        },
        {
          q: "Can I track my order?",
          a: "Yes! You'll receive a tracking number via email once your order ships. You can also track orders through your account dashboard."
        },
        {
          q: "What if my package is lost or damaged?",
          a: "We work with reliable carriers, but if your package is lost or arrives damaged, contact us immediately. We'll arrange a replacement or refund."
        }
      ]
    },
    {
      category: "Returns & Exchanges",
      questions: [
        {
          q: "What is your return policy?",
          a: "We offer a 30-day return window from the date of delivery. Items must be unworn, unwashed, with tags attached, and in original packaging."
        },
        {
          q: "How do I return an item?",
          a: "Log into your account, select the items to return, and print your prepaid return label. Pack securely and drop off at any Royal Mail location."
        },
        {
          q: "Can I exchange an item?",
          a: "Yes! We accept exchanges for different sizes or colours. Return the original item and place a new order for the item you want to ensure availability."
        },
        {
          q: "When will I receive my refund?",
          a: "Refunds are processed within 5-7 business days after we receive your return. It may take an additional 3-5 days for your bank to process the refund."
        },
        {
          q: "Are sale items returnable?",
          a: "Most sale items are returnable within our standard 30-day policy. Items marked as 'Final Sale' cannot be returned or exchanged."
        }
      ]
    },
    {
      category: "Products & Sizing",
      questions: [
        {
          q: "How do I find my size?",
          a: "Use our comprehensive size guide which includes measurements for all product categories. If you're between sizes, we recommend sizing up for a relaxed fit or choosing your usual size for compression fit."
        },
        {
          q: "Are your products true to size?",
          a: "Yes, our products follow UK sizing standards. Each product page includes fit notes (compression, regular, or relaxed) to help you choose."
        },
        {
          q: "What materials are your products made from?",
          a: "Our products use premium performance fabrics including moisture-wicking polyester blends, breathable nylon, and comfortable spandex. Full composition details are on each product page."
        },
        {
          q: "How should I care for my activewear?",
          a: "Machine wash cold with like colours, tumble dry low or hang dry. Avoid fabric softeners and bleach. Full care instructions are included with each item and on product pages."
        },
        {
          q: "Do you restock sold-out items?",
          a: "Popular items are regularly restocked. You can sign up for back-in-stock notifications on product pages to be alerted when items return."
        }
      ]
    },
    {
      category: "Account & Membership",
      questions: [
        {
          q: "Do I need an account to place an order?",
          a: "No, you can checkout as a guest. However, creating an account allows you to track orders, save favourites, and enjoy a faster checkout experience."
        },
        {
          q: "How do I reset my password?",
          a: "Click 'Forgot Password' on the login page. Enter your email address and we'll send you a password reset link."
        },
        {
          q: "Can I change my email address?",
          a: "Yes, log into your account and go to Profile Settings. You can update your email address and other personal information there."
        },
        {
          q: "What is the Influencer Programme?",
          a: "Our Influencer Programme offers exclusive benefits to fitness content creators and brand ambassadors, including special pricing, early access, and promotional opportunities. Apply through the link in our footer."
        }
      ]
    },
    {
      category: "Reseller Program",
      questions: [
        {
          q: "How do I become a reseller?",
          a: "Visit our Reseller Portal and submit an application. We review applications within 5-7 business days. Once approved, you'll gain access to wholesale pricing and your own branded storefront."
        },
        {
          q: "What are the reseller benefits?",
          a: "Resellers receive wholesale pricing (typically 30% off retail), a custom branded storefront, dedicated support, and flexible payment terms with approved credit."
        },
        {
          q: "Is there a minimum order requirement?",
          a: "Yes, resellers must meet a minimum order value of £500 per order. This ensures competitive pricing and efficient fulfilment."
        },
        {
          q: "How does the reseller storefront work?",
          a: "Each approved reseller gets a unique URL for their branded storefront. You can select products from our catalogue, set your own markup, and track orders through your dashboard."
        }
      ]
    }
  ];

  const allQuestions = faqCategories.flatMap((cat, catIndex) => 
    cat.questions.map((q, qIndex) => ({
      ...q,
      category: cat.category,
      index: catIndex * 100 + qIndex
    }))
  );

  const filteredQuestions = searchQuery
    ? allQuestions.filter(
        (item) =>
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allQuestions;

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
              <HelpCircle className="w-16 h-16 text-primary mx-auto mb-6" />
              <h1 className="text-5xl font-bold mb-4" data-testid="heading-faq">
                Frequently Asked Questions
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Find answers to common questions about orders, shipping, returns, and more
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for answers..."
                  className="pl-12 min-h-12 text-base"
                  data-testid="input-search-faq"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {searchQuery ? (
            /* Search Results */
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Found {filteredQuestions.length} result{filteredQuestions.length !== 1 ? 's' : ''}
              </p>
              {filteredQuestions.map((item) => (
                <Card 
                  key={item.index}
                  className="hover-elevate cursor-pointer"
                  onClick={() => toggleQuestion(item.index)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                            {item.category}
                          </span>
                        </div>
                        <h3 className="font-semibold mb-2">{item.q}</h3>
                        {openIndex === item.index && (
                          <p className="text-sm text-muted-foreground mt-3">
                            {item.a}
                          </p>
                        )}
                      </div>
                      {openIndex === item.index ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Categories View */
            <div className="space-y-8">
              {faqCategories.map((category, catIndex) => (
                <Card key={catIndex}>
                  <CardHeader>
                    <CardTitle>{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {category.questions.map((item, qIndex) => {
                      const itemIndex = catIndex * 100 + qIndex;
                      return (
                        <div
                          key={qIndex}
                          className="border border-card-border rounded-lg p-4 hover-elevate cursor-pointer"
                          onClick={() => toggleQuestion(itemIndex)}
                          data-testid={`faq-item-${itemIndex}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-semibold flex-1">{item.q}</h3>
                            {openIndex === itemIndex ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                          {openIndex === itemIndex && (
                            <p className="text-sm text-muted-foreground mt-3 pr-6">
                              {item.a}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Still Need Help */}
          <Card className="mt-12 bg-primary/5 border-primary/20">
            <CardContent className="py-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
                <p className="text-muted-foreground mb-4">
                  Our customer care team is here to help
                </p>
                <a 
                  href="/contact-support" 
                  className="inline-flex items-center justify-center h-11 px-8 rounded-md bg-primary text-primary-foreground font-medium hover-elevate active-elevate-2"
                  data-testid="link-contact-support"
                >
                  Contact Support
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
