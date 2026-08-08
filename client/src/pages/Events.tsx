import HeaderClean from '@/components/HeaderClean';
import ScrollReveal from '@/components/ScrollReveal';
import { Calendar, MapPin, Clock, Users, ChevronRight, Bell, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EventType {
  id: string;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  image_url: string | null;
  spots: number | null;
  registered_count: number;
  is_active: boolean;
  is_featured: boolean;
}

export default function Events() {
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [subscribeEmail, setSubscribeEmail] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch events from database
  const { data: upcomingEvents = [], isLoading: eventsLoading } = useQuery<EventType[]>({
    queryKey: ['/api/events'],
  });

  const pastEvents = [
    { title: "Christmas Charity Run", date: "December 2024", attendees: 150 },
    { title: "Black Friday Pop-up", date: "November 2024", attendees: 500 },
    { title: "Summer Training Camp", date: "August 2024", attendees: 75 },
    { title: "Manchester Marathon Support", date: "April 2024", attendees: 200 }
  ];

  // Calculate event type counts from live data
  const eventTypes = upcomingEvents.reduce((acc, event) => {
    const existing = acc.find(e => e.type === event.event_type);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ type: event.event_type, count: 1 });
    }
    return acc;
  }, [] as { type: string; count: number }[]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Registration mutation - registers for event
  const registerMutation = useMutation({
    mutationFn: async (data: { eventId: string; email: string; firstName: string; lastName: string; phone?: string }) => {
      return apiRequest('POST', `/api/events/${data.eventId}/register`, {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone
      });
    },
    onSuccess: () => {
      setRegistrationSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Registration Successful!",
        description: `You're registered for ${selectedEvent?.title}. Check your email for confirmation.`,
      });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to register. Please try again.";
      if (message.includes('already registered')) {
        setRegistrationSuccess(true);
        toast({
          title: "You're Already Registered",
          description: `We've noted your interest in ${selectedEvent?.title}. See you there!`,
        });
      } else {
        toast({
          title: "Registration Failed",
          description: message,
          variant: "destructive"
        });
      }
    }
  });

  // Subscribe mutation for event notifications
  const subscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest('POST', '/api/newsletter/subscribe', {
        email,
        source: 'events-page'
      });
    },
    onSuccess: () => {
      setSubscribeEmail('');
      toast({
        title: "Subscribed!",
        description: "You'll receive notifications about upcoming events.",
      });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to subscribe. Please try again.";
      if (message.includes('already subscribed')) {
        toast({
          title: "Already Subscribed",
          description: "You're already receiving our event notifications.",
        });
        setSubscribeEmail('');
      } else {
        toast({
          title: "Subscription Failed",
          description: message,
          variant: "destructive"
        });
      }
    }
  });

  const handleRegisterClick = (event: EventType) => {
    setSelectedEvent(event);
    setRegistrationSuccess(false);
    setRegistrationForm({ firstName: '', lastName: '', email: '', phone: '' });
    setShowRegistrationDialog(true);
  };

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationForm.email || !registrationForm.firstName) {
      toast({
        title: "Required Fields",
        description: "Please fill in your first name and email.",
        variant: "destructive"
      });
      return;
    }
    registerMutation.mutate({
      eventId: selectedEvent?.id || '',
      email: registrationForm.email,
      firstName: registrationForm.firstName,
      lastName: registrationForm.lastName,
      phone: registrationForm.phone
    });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail || !subscribeEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    subscribeMutation.mutate(subscribeEmail);
  };

  return (
    <div className="min-h-screen bg-white">
      <HeaderClean />
      
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto py-20">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 mb-6 px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-semibold tracking-wider uppercase">
              <Calendar className="w-4 h-4" />
              Events
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight" data-testid="events-heading">
              Upcoming Events
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <p className="text-xl md:text-2xl font-light leading-relaxed max-w-3xl mx-auto text-gray-200">
              Connect with the 1stRep community at workouts, launches, and exclusive events.
            </p>
          </ScrollReveal>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      <section className="py-16 px-4 bg-black text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4">
            {eventTypes.map((item, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <Badge variant="outline" className="text-white border-white/30 px-4 py-2 text-sm">
                  {item.type}: {item.count} events
                </Badge>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">What's Next</div>
              <h2 className="text-5xl font-bold mb-6 text-black">Upcoming Events</h2>
            </div>
          </ScrollReveal>
          
          <div className="space-y-8">
            {eventsLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                <p className="text-gray-500 mt-4">Loading events...</p>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No upcoming events at the moment. Check back soon!</p>
              </div>
            ) : (
              upcomingEvents.map((event, index) => (
                <ScrollReveal key={event.id} delay={index * 0.1}>
                  <div className="bg-gray-50 overflow-hidden flex flex-col md:flex-row">
                    <div className="md:w-1/3">
                      <img 
                        src={event.image_url || 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=600'} 
                        alt={event.title}
                        className="w-full h-64 md:h-full object-cover"
                      />
                    </div>
                    <div className="md:w-2/3 p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge variant="secondary">{event.event_type}</Badge>
                        <span className="text-sm text-gray-500">
                          {event.spots === null 
                            ? 'Unlimited spots' 
                            : `${Math.max(0, event.spots - event.registered_count)} spots left`}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-black mb-4">{event.title}</h3>
                      <p className="text-gray-600 mb-6">{event.description}</p>
                      
                      <div className="flex flex-wrap gap-6 mb-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(event.event_date)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {event.start_time} - {event.end_time}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      </div>
                      
                      <Button 
                        className="bg-black text-white hover:bg-gray-800"
                        onClick={() => handleRegisterClick(event)}
                        disabled={event.spots !== null && event.registered_count >= event.spots}
                        data-testid={`button-register-${event.id}`}
                      >
                        {event.spots !== null && event.registered_count >= event.spots ? 'Fully Booked' : 'Register Now'}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </ScrollReveal>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">History</div>
              <h2 className="text-5xl font-bold mb-6 text-black">Past Events</h2>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 gap-6">
            {pastEvents.map((event, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <div className="bg-white p-6 shadow-sm flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-black">{event.title}</h3>
                    <p className="text-gray-500 text-sm">{event.date}</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{event.attendees}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <ScrollReveal>
            <div className="bg-gray-900 text-white p-12 text-center">
              <Bell className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl font-bold mb-4">Never Miss an Event</h2>
              <p className="text-gray-300 mb-8">
                Subscribe to get notified about upcoming events, early bird tickets, and exclusive community meetups.
              </p>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  data-testid="input-event-email"
                />
                <Button 
                  type="submit"
                  className="bg-white text-black hover:bg-gray-100" 
                  disabled={subscribeMutation.isPending}
                  data-testid="button-subscribe-events"
                >
                  {subscribeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Want to Host an Event?</h2>
            <p className="text-xl leading-relaxed text-gray-200 mb-12">
              Partner with 1stRep to host fitness events, pop-ups, or brand activations in your area.
            </p>
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-black hover:bg-gray-100 px-12 py-6 text-lg font-semibold"
              data-testid="button-contact-events"
            >
              <a href="mailto:events@1strep.com">Contact Events Team</a>
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* Event Registration Dialog */}
      <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {registrationSuccess ? "Registration Complete!" : `Register for Event`}
            </DialogTitle>
            <DialogDescription>
              {registrationSuccess 
                ? "We'll send you all the details via email."
                : selectedEvent?.title
              }
            </DialogDescription>
          </DialogHeader>
          
          {registrationSuccess ? (
            <div className="py-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">You're Registered!</h3>
              <p className="text-muted-foreground mb-4">
                See you at {selectedEvent?.title} on {selectedEvent?.date}.
              </p>
              <div className="bg-muted p-4 rounded-lg text-sm text-left">
                <p><strong>Date:</strong> {selectedEvent?.date}</p>
                <p><strong>Time:</strong> {selectedEvent?.time}</p>
                <p><strong>Location:</strong> {selectedEvent?.location}</p>
              </div>
              <Button 
                className="mt-6" 
                onClick={() => setShowRegistrationDialog(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRegistrationSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={registrationForm.firstName}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                    required
                    data-testid="input-registration-firstname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={registrationForm.lastName}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Smith"
                    data-testid="input-registration-lastname"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={registrationForm.email}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  required
                  data-testid="input-registration-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={registrationForm.phone}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+44 7123 456789"
                  data-testid="input-registration-phone"
                />
              </div>
              
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium">{selectedEvent?.title}</p>
                <p className="text-muted-foreground">{selectedEvent?.date} • {selectedEvent?.time}</p>
                <p className="text-muted-foreground">{selectedEvent?.location}</p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowRegistrationDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={registerMutation.isPending}
                  data-testid="button-submit-registration"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register"
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
