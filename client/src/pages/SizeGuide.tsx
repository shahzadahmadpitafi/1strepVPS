import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Ruler, User, ShoppingBag, Info, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function SizeGuide() {
  const sizeCharts = {
    tops: {
      title: "Tops (T-Shirts, Hoodies, Vests)",
      headers: ["Size", "UK", "Chest (cm)", "Waist (cm)", "Height (cm)"],
      rows: [
        ["XS", "6-8", "81-86", "66-71", "160-165"],
        ["S", "8-10", "86-91", "71-76", "165-170"],
        ["M", "10-12", "91-97", "76-81", "170-175"],
        ["L", "12-14", "97-102", "81-86", "175-180"],
        ["XL", "14-16", "102-109", "86-94", "180-185"],
        ["XXL", "16-18", "109-117", "94-102", "185-190"]
      ]
    },
    bottoms: {
      title: "Bottoms (Leggings, Shorts)",
      headers: ["Size", "UK", "Waist (cm)", "Hips (cm)", "Inside Leg (cm)"],
      rows: [
        ["XS", "6-8", "61-66", "86-91", "76"],
        ["S", "8-10", "66-71", "91-97", "78"],
        ["M", "10-12", "71-76", "97-102", "79"],
        ["L", "12-14", "76-81", "102-107", "81"],
        ["XL", "14-16", "81-89", "107-112", "81"],
        ["XXL", "16-18", "89-97", "112-119", "81"]
      ]
    }
  };

  const fitTips = [
    {
      icon: User,
      title: "How to Measure",
      tips: [
        "Chest: Measure around the fullest part of your chest",
        "Waist: Measure around your natural waistline",
        "Hips: Measure around the fullest part of your hips",
        "Inside Leg: Measure from crotch to floor"
      ]
    },
    {
      icon: ShoppingBag,
      title: "Between Sizes?",
      tips: [
        "For a relaxed fit, size up",
        "For compression/tight fit, choose your usual size",
        "Check product descriptions for fit notes",
        "Contact our team for personalised recommendations"
      ]
    },
    {
      icon: Info,
      title: "Fit Guide",
      tips: [
        "Compression Fit: Tight to body, like second skin",
        "Regular Fit: Close to body with room to move",
        "Relaxed Fit: Loose and comfortable",
        "Oversized: Intentionally loose and roomy"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" size="sm" asChild data-testid="button-back">
          <Link href="/shop-clean">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Link>
        </Button>
      </div>

      {/* Hero Section */}
      <div className="bg-card border-b border-card-border">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <Ruler className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-5xl font-bold mb-4" data-testid="heading-size-guide">
              Size Guide
            </h1>
            <p className="text-xl text-muted-foreground">
              Find your perfect fit with our comprehensive sizing charts
            </p>
          </div>
        </div>
      </div>

      {/* Size Charts Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Fit Tips */}
          <div className="grid md:grid-cols-3 gap-6">
            {fitTips.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <section.icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Tops Size Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{sizeCharts.tops.title}</CardTitle>
              <CardDescription>All measurements in centimeters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-card-border">
                      {sizeCharts.tops.headers.map((header) => (
                        <th key={header} className="text-left py-3 px-4 font-semibold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeCharts.tops.rows.map((row, index) => (
                      <tr key={index} className="border-b border-card-border/50">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="py-3 px-4 text-muted-foreground">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Bottoms Size Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{sizeCharts.bottoms.title}</CardTitle>
              <CardDescription>All measurements in centimeters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-card-border">
                      {sizeCharts.bottoms.headers.map((header) => (
                        <th key={header} className="text-left py-3 px-4 font-semibold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeCharts.bottoms.rows.map((row, index) => (
                      <tr key={index} className="border-b border-card-border/50">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="py-3 px-4 text-muted-foreground">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support Section */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Still need help?</h3>
                <p className="text-muted-foreground mb-4">
                  Our customer care team is here to help you find the perfect fit
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
