import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, MapPin, Clock, Users, Edit2, Trash2, Eye, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Event {
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
  created_at: string;
}

interface EventRegistration {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: string;
  registered_at: string;
}

const EVENT_TYPES = ['Workout', 'Launch', 'Running', 'Online', 'Networking', 'Workshop', 'Competition'];

export default function AdminEvents() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRegistrationsDialog, setShowRegistrationsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'Workout',
    eventDate: '',
    startTime: '',
    endTime: '',
    location: '',
    imageUrl: '',
    spots: '',
    isActive: true,
    isFeatured: false,
  });

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['/api/admin/events'],
  });

  const { data: registrations, isLoading: registrationsLoading } = useQuery<EventRegistration[]>({
    queryKey: ['/api/admin/events', selectedEvent?.id, 'registrations'],
    enabled: !!selectedEvent && showRegistrationsDialog,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiRequest('POST', '/api/admin/events', {
        ...data,
        spots: data.spots ? parseInt(data.spots) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      setShowCreateDialog(false);
      resetForm();
      toast({ title: 'Event created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: typeof formData }) =>
      apiRequest('PATCH', `/api/admin/events/${data.id}`, {
        ...data.updates,
        spots: data.updates.spots ? parseInt(data.updates.spots) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      setShowEditDialog(false);
      resetForm();
      toast({ title: 'Event updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      setShowDeleteDialog(false);
      setSelectedEvent(null);
      toast({ title: 'Event deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      eventType: 'Workout',
      eventDate: '',
      startTime: '',
      endTime: '',
      location: '',
      imageUrl: '',
      spots: '',
      isActive: true,
      isFeatured: false,
    });
  };

  const openEditDialog = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      eventType: event.event_type,
      eventDate: event.event_date.split('T')[0],
      startTime: event.start_time,
      endTime: event.end_time,
      location: event.location,
      imageUrl: event.image_url || '',
      spots: event.spots?.toString() || '',
      isActive: event.is_active,
      isFeatured: event.is_featured,
    });
    setShowEditDialog(true);
  };

  const openRegistrationsDialog = (event: Event) => {
    setSelectedEvent(event);
    setShowRegistrationsDialog(true);
  };

  const openDeleteDialog = (event: Event) => {
    setSelectedEvent(event);
    setShowDeleteDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEvent && showEditDialog) {
      updateMutation.mutate({ id: selectedEvent.id, updates: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getEventTypeColour = (type: string) => {
    const colours: Record<string, string> = {
      Workout: 'bg-green-500/10 text-green-600 dark:text-green-400',
      Launch: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      Running: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      Online: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      Networking: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
      Workshop: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      Competition: 'bg-red-500/10 text-red-600 dark:text-red-400',
    };
    return colours[type] || 'bg-muted text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="admin-events-title">Community Events</h1>
          <p className="text-muted-foreground">Create and manage community events</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-event">
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Events Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events?.map((event) => (
          <Card key={event.id} className="overflow-hidden" data-testid={`event-card-${event.id}`}>
            {event.image_url && (
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                {!event.is_active && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Badge variant="secondary">Inactive</Badge>
                  </div>
                )}
              </div>
            )}
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getEventTypeColour(event.event_type)}>{event.event_type}</Badge>
                    {event.is_featured && <Badge variant="outline">Featured</Badge>}
                  </div>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(event.event_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{event.start_time} - {event.end_time}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>
                    {event.registered_count} registered
                    {event.spots && ` / ${event.spots} spots`}
                    {!event.spots && ' (unlimited)'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openRegistrationsDialog(event)}
                  data-testid={`button-view-registrations-${event.id}`}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Registrations
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(event)}
                  data-testid={`button-edit-event-${event.id}`}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => openDeleteDialog(event)}
                  data-testid={`button-delete-event-${event.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {events?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No events yet. Create your first event to get started.
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setSelectedEvent(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEditDialog ? 'Edit Event' : 'Create New Event'}</DialogTitle>
            <DialogDescription>
              {showEditDialog ? 'Update the event details below.' : 'Fill in the details to create a new community event.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Community Workout Session"
                  required
                  data-testid="input-event-title"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the event..."
                  rows={3}
                  required
                  data-testid="input-event-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type *</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                >
                  <SelectTrigger data-testid="select-event-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDate">Date *</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  required
                  data-testid="input-event-date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  placeholder="e.g., 10:00 AM"
                  required
                  data-testid="input-start-time"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  placeholder="e.g., 12:00 PM"
                  required
                  data-testid="input-end-time"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Third Space, Manchester"
                  required
                  data-testid="input-event-location"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  data-testid="input-image-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spots">Maximum Spots</Label>
                <Input
                  id="spots"
                  type="number"
                  value={formData.spots}
                  onChange={(e) => setFormData({ ...formData, spots: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  min="1"
                  data-testid="input-spots"
                />
              </div>

              <div className="space-y-4 flex items-end gap-6 pb-1">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    data-testid="switch-is-active"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                    data-testid="switch-is-featured"
                  />
                  <Label htmlFor="isFeatured">Featured</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setShowEditDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-event"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {showEditDialog ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Registrations Dialog */}
      <Dialog open={showRegistrationsDialog} onOpenChange={(open) => {
        if (!open) {
          setShowRegistrationsDialog(false);
          setSelectedEvent(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrations - {selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.registered_count} people registered for this event
            </DialogDescription>
          </DialogHeader>

          {registrationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : registrations?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No registrations yet for this event.
            </div>
          ) : (
            <div className="space-y-2">
              {registrations?.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{reg.first_name} {reg.last_name}</p>
                    <p className="text-sm text-muted-foreground">{reg.email}</p>
                    {reg.phone && <p className="text-sm text-muted-foreground">{reg.phone}</p>}
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{reg.status}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(reg.registered_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedEvent?.title}"? This will also delete all registrations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => selectedEvent && deleteMutation.mutate(selectedEvent.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
