import HeaderClean from '@/components/HeaderClean';
import ScrollReveal from '@/components/ScrollReveal';
import { Briefcase, MapPin, Clock, Users, Heart, Zap, Coffee, Dumbbell, ChevronRight, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface JobRole {
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
}

export default function Careers() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    coverLetter: '',
    linkedinUrl: '',
    portfolioUrl: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const applicationMutation = useMutation({
    mutationFn: async (data: typeof formData & { jobTitle: string; department: string; location: string }) => {
      const response = await apiRequest("POST", "/api/job-applications", data);
      return response.json();
    },
    onSuccess: (data) => {
      setSubmitted(true);
      toast({
        title: "Application Submitted",
        description: data.message || "Your application has been received. We shall be in touch soon.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Unable to submit your application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApply = (role: JobRole) => {
    setSelectedRole(role);
    setSubmitted(false);
    setFormData({
      applicantName: '',
      applicantEmail: '',
      applicantPhone: '',
      coverLetter: '',
      linkedinUrl: '',
      portfolioUrl: ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    if (!formData.applicantName || !formData.applicantEmail || !formData.applicantPhone || !formData.coverLetter) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    applicationMutation.mutate({
      ...formData,
      jobTitle: selectedRole.title,
      department: selectedRole.department,
      location: selectedRole.location,
    });
  };

  const benefits = [
    { icon: Dumbbell, title: "Free Gym Membership", description: "Stay fit with complimentary access to premium gyms" },
    { icon: Heart, title: "Health Insurance", description: "Comprehensive private health coverage for you and family" },
    { icon: Coffee, title: "Flexible Working", description: "Hybrid work options and flexible hours" },
    { icon: Zap, title: "Product Discounts", description: "60% off all 1stRep products" }
  ];

  const openRoles: JobRole[] = [
    {
      title: "Senior Product Designer",
      department: "Design",
      location: "Manchester, UK",
      type: "Full-time",
      description: "Lead the design of our next generation of performance apparel."
    },
    {
      title: "E-commerce Manager",
      department: "Marketing",
      location: "Remote, UK",
      type: "Full-time",
      description: "Drive our online sales strategy and customer experience."
    },
    {
      title: "Warehouse Operations Lead",
      department: "Operations",
      location: "Birmingham, UK",
      type: "Full-time",
      description: "Manage our growing distribution centre operations."
    },
    {
      title: "Social Media Coordinator",
      department: "Marketing",
      location: "Manchester, UK",
      type: "Full-time",
      description: "Create engaging content and grow our online community."
    },
    {
      title: "Customer Success Specialist",
      department: "Customer Care",
      location: "Remote, UK",
      type: "Full-time",
      description: "Deliver exceptional support to our athlete community."
    },
    {
      title: "Junior Developer",
      department: "Technology",
      location: "Manchester, UK",
      type: "Full-time",
      description: "Help build and maintain our e-commerce platform."
    }
  ];

  const values = [
    { title: "Performance First", description: "We push boundaries and strive for excellence in everything we do." },
    { title: "Team Spirit", description: "We succeed together, supporting and celebrating each other." },
    { title: "Customer Obsessed", description: "Our athletes are at the heart of every decision we make." },
    { title: "Move Fast", description: "We embrace agility and aren't afraid to take calculated risks." }
  ];

  return (
    <div className="min-h-screen bg-white">
      <HeaderClean />
      
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto py-20">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 mb-6 px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-semibold tracking-wider uppercase">
              <Briefcase className="w-4 h-4" />
              Join Our Team
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight" data-testid="careers-heading">
              Careers at 1stRep
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <p className="text-xl md:text-2xl font-light leading-relaxed max-w-3xl mx-auto text-gray-200">
              Join a team that's passionate about empowering athletes worldwide.
            </p>
          </ScrollReveal>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Why 1stRep</div>
              <h2 className="text-5xl font-bold mb-6 text-black">Our Values</h2>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <ScrollReveal key={index} delay={index * 0.1} direction="up">
                <div className="bg-gray-50 p-8">
                  <h3 className="text-xl font-bold mb-4 text-black">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Perks</div>
              <h2 className="text-5xl font-bold mb-6 text-black">Benefits & Perks</h2>
              <p className="text-xl text-gray-600">We take care of our team so they can focus on what they do best.</p>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <ScrollReveal key={index} delay={index * 0.1}>
                  <div className="bg-white p-8 text-center shadow-sm">
                    <Icon className="w-12 h-12 mx-auto mb-6 text-black" />
                    <h3 className="text-xl font-bold mb-3 text-black">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Opportunities</div>
              <h2 className="text-5xl font-bold mb-6 text-black">Open Roles</h2>
              <p className="text-xl text-gray-600">Find your next opportunity with us.</p>
            </div>
          </ScrollReveal>
          
          <div className="space-y-4">
            {openRoles.map((role, index) => (
              <ScrollReveal key={index} delay={index * 0.05}>
                <div className="bg-gray-50 p-6 hover:bg-gray-100 transition-colors group cursor-pointer">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-black">{role.title}</h3>
                        <Badge variant="secondary">{role.department}</Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{role.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {role.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {role.type}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="group-hover:bg-black group-hover:text-white transition-colors"
                      onClick={() => handleApply(role)}
                      data-testid={`button-apply-${role.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      Apply Now
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <Users className="w-16 h-16 mx-auto mb-8 opacity-80" />
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Don't See Your Role?</h2>
            <p className="text-xl leading-relaxed text-gray-200 mb-12">
              We're always looking for talented people. Send us your CV and we'll keep you in mind for future opportunities.
            </p>
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-gray-100 px-12 py-6 text-lg font-semibold"
              data-testid="button-send-cv"
              onClick={() => window.location.href = 'mailto:careers@1strep.com'}
            >
              Send Your CV
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* Job Application Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-apply-title">Apply for {selectedRole?.title}</DialogTitle>
            <DialogDescription>
              {selectedRole?.department} | {selectedRole?.location}
            </DialogDescription>
          </DialogHeader>
          
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Application Submitted!</h3>
                <p className="text-muted-foreground mb-4">
                  Thank you for applying. We shall review your application and get back to you shortly.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                data-testid="button-close-dialog"
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="applicantName">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="applicantName"
                  value={formData.applicantName}
                  onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                  placeholder="John Smith"
                  data-testid="input-applicant-name"
                  className="min-h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicantEmail">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="applicantEmail"
                  type="email"
                  value={formData.applicantEmail}
                  onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
                  placeholder="john.smith@example.com"
                  data-testid="input-applicant-email"
                  className="min-h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicantPhone">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="applicantPhone"
                  type="tel"
                  value={formData.applicantPhone}
                  onChange={(e) => setFormData({ ...formData, applicantPhone: e.target.value })}
                  placeholder="+44 7123 456789"
                  data-testid="input-applicant-phone"
                  className="min-h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn Profile (Optional)</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                  data-testid="input-linkedin-url"
                  className="min-h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolioUrl">Portfolio/Website (Optional)</Label>
                <Input
                  id="portfolioUrl"
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                  placeholder="https://yourportfolio.com"
                  data-testid="input-portfolio-url"
                  className="min-h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverLetter">
                  Cover Letter / Why You're Interested <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="coverLetter"
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                  placeholder="Tell us about yourself, your experience, and why you'd be a great fit for this role..."
                  rows={5}
                  data-testid="input-cover-letter"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                  data-testid="button-cancel-application"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={applicationMutation.isPending}
                  data-testid="button-submit-application"
                >
                  {applicationMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}