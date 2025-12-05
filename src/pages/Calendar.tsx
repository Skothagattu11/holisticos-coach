/**
 * Calendar Page
 * Coach calendar view showing scheduled sessions and weekly check-ins
 */

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Video, ClipboardCheck, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCalendarEventsGrouped } from '@/hooks/useCalendar';
import { useExpertIdForUser } from '@/hooks/useCoaches';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/lib/services/calendarService';

const CalendarPage = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [focusedMonth, setFocusedMonth] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Get the expert ID for the current user (user.id might != expert.id)
  const { data: expertId, isLoading: loadingExpertId } = useExpertIdForUser(user?.id);

  // Calculate date range for the focused month
  const dateRange = useMemo(() => {
    return {
      start: startOfMonth(focusedMonth),
      end: endOfMonth(focusedMonth),
    };
  }, [focusedMonth]);

  // Fetch events for the month using the expert ID
  const { data: eventsMap, isLoading: loadingEvents } = useCalendarEventsGrouped(
    expertId || undefined,
    dateRange.start,
    dateRange.end
  );

  const isLoading = loadingExpertId || loadingEvents;

  // Get events for the selected date
  const selectedDateEvents = useMemo(() => {
    if (!eventsMap) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return eventsMap.get(dateKey) || [];
  }, [eventsMap, selectedDate]);

  // Get dates that have events (for calendar highlighting)
  const datesWithEvents = useMemo(() => {
    if (!eventsMap) return new Set<string>();
    return new Set(eventsMap.keys());
  }, [eventsMap]);

  // Custom day render for the calendar
  const modifiers = useMemo(() => {
    const hasSession: Date[] = [];
    const hasCheckin: Date[] = [];

    eventsMap?.forEach((events, dateKey) => {
      const date = new Date(dateKey);
      if (events.some((e) => e.type === 'session')) {
        hasSession.push(date);
      }
      if (events.some((e) => e.type === 'checkin')) {
        hasCheckin.push(date);
      }
    });

    return { hasSession, hasCheckin };
  }, [eventsMap]);

  const formatEventTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const formatEventDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const navigateMonth = (delta: number) => {
    setFocusedMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            View your scheduled sessions and client check-ins
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {format(focusedMonth, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={focusedMonth}
              onMonthChange={setFocusedMonth}
              modifiers={modifiers}
              modifiersStyles={{
                hasSession: {
                  position: 'relative',
                },
                hasCheckin: {
                  position: 'relative',
                },
              }}
              components={{
                DayContent: ({ date }) => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const events = eventsMap?.get(dateKey) || [];
                  const hasSession = events.some((e) => e.type === 'session');
                  const hasCheckin = events.some((e) => e.type === 'checkin');

                  return (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <span>{date.getDate()}</span>
                      {(hasSession || hasCheckin) && (
                        <div className="absolute bottom-0 flex gap-0.5">
                          {hasSession && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          )}
                          {hasCheckin && (
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                },
              }}
              className="rounded-md border-0"
            />

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Sessions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span>Check-ins</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events List Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {isSameDay(selectedDate, new Date())
                ? 'Today'
                : format(selectedDate, 'EEEE, MMMM d')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : selectedDateEvents.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No events scheduled</p>
                <p className="text-sm text-muted-foreground/70">
                  No sessions or check-ins for this day
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors',
                      'hover:bg-accent/50'
                    )}
                  >
                    {/* Event Icon */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
                        event.type === 'session'
                          ? 'bg-blue-500/15 text-blue-500'
                          : 'bg-green-500/15 text-green-500'
                      )}
                    >
                      {event.type === 'session' ? (
                        <Video className="h-5 w-5" />
                      ) : (
                        <ClipboardCheck className="h-5 w-5" />
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{event.title}</h4>
                        {event.type === 'checkin' && (
                          <Badge
                            variant={event.status === 'reviewed' ? 'default' : 'secondary'}
                            className={cn(
                              'text-xs',
                              event.status === 'reviewed'
                                ? 'bg-green-500/15 text-green-500 hover:bg-green-500/25'
                                : 'bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25'
                            )}
                          >
                            {event.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {event.clientName}
                        </span>
                        {event.type === 'session' && (
                          <>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatEventTime(event.dateTime)}
                            </span>
                            <span>{event.durationMinutes} min</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  selectedEvent?.type === 'session'
                    ? 'bg-blue-500/15 text-blue-500'
                    : 'bg-green-500/15 text-green-500'
                )}
              >
                {selectedEvent?.type === 'session' ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <ClipboardCheck className="h-5 w-5" />
                )}
              </div>
              <span>{selectedEvent?.title}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{selectedEvent.clientName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {formatEventDate(selectedEvent.dateTime)}
                  </p>
                </div>
                {selectedEvent.type === 'session' && (
                  <>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">
                        {formatEventTime(selectedEvent.dateTime)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">
                        {selectedEvent.durationMinutes} minutes
                      </p>
                    </div>
                  </>
                )}
                {selectedEvent.type === 'checkin' && (
                  <>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        variant={selectedEvent.status === 'reviewed' ? 'default' : 'secondary'}
                        className={cn(
                          selectedEvent.status === 'reviewed'
                            ? 'bg-green-500/15 text-green-500'
                            : 'bg-yellow-500/15 text-yellow-500'
                        )}
                      >
                        {selectedEvent.status === 'reviewed' ? 'Reviewed' : 'Pending Review'}
                      </Badge>
                    </div>
                    {selectedEvent.metadata?.week_number && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Week</p>
                        <p className="font-medium">
                          Week {selectedEvent.metadata.week_number}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {selectedEvent.type === 'session' && selectedEvent.metadata?.meeting_url && (
                <Button className="w-full" asChild>
                  <a
                    href={selectedEvent.metadata.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Join Meeting
                  </a>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
