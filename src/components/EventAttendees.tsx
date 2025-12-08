
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { User } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { UserProfileDialog } from "./UserProfileDialog";
import { Skeleton } from "./ui/skeleton";
import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase';
import { Users as UsersIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type EventAttendeesProps = {
  eventId: string;
};

const MAX_AVATARS_SHOWN = 7;

export function EventAttendees({ eventId }: EventAttendeesProps) {
  const [participants, setParticipants] = useState<User[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [maxParticipants, setMaxParticipants] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (!eventId || authLoading) {
      setIsLoading(true);
      return;
    }

    const fetchAttendees = async () => {
      setIsLoading(true);
      try {
        // Fetch event details for max participants only
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('max_participants')
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;

        if (eventData) {
          setMaxParticipants(eventData.max_participants || null);
        }

        // Fetch attendees joined with users
        const { data: attendeesData, error: attendeesError } = await supabase
          .from('attendees')
          .select('user_id, users(*)')
          .eq('event_id', eventId)
          .eq('status', 'confirmed')
          .limit(30);

        if (attendeesError) throw attendeesError;

        if (attendeesData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const users = attendeesData.map((a: any) => a.users as User);
          setParticipants(users);
          // Calculate participant count from actual attendees
          setParticipantCount(attendeesData.length);
        } else {
          setParticipants([]);
          setParticipantCount(0);
        }
      } catch (error) {
        console.error("Error fetching participants:", JSON.stringify(error, null, 2));
        setParticipants([]);
        setParticipantCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendees();
  }, [eventId, authLoading]);

  const attendeesToShow = participants.slice(0, MAX_AVATARS_SHOWN);
  const remainingCount = participantCount - attendeesToShow.length;

  return (
    <div className="bg-card/50 rounded-lg p-4 border border-border/50">
      <Dialog>
        <div className="flex items-center justify-between mb-4">
          <DialogTrigger asChild>
            <h3 className="text-xl font-headline font-semibold flex items-center gap-3 cursor-pointer group hover:text-primary transition-colors">
              Quem vai
              <Badge variant="secondary" className="text-sm bg-primary/20 text-primary">{participantCount}</Badge>
            </h3>
          </DialogTrigger>
          {maxParticipants && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UsersIcon className="w-4 h-4" />
              <span>{participantCount} / {maxParticipants}</span>
            </div>
          )}
        </div>
        <div className="flex items-center -space-x-3">
          {isLoading || authLoading ? (
            [...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-10 rounded-full border-2 border-background" />)
          ) : (
            <>
              {attendeesToShow.map((user) => (
                <UserProfileDialog key={user.id} user={user}>
                  <Avatar className="h-10 w-10 border-2 border-background hover:scale-110 transition-transform cursor-pointer">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-muted text-muted-foreground">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </UserProfileDialog>
              ))}
              {remainingCount > 0 && (
                <DialogTrigger asChild>
                  <Avatar className="h-10 w-10 border-2 border-background cursor-pointer">
                    <AvatarFallback className="bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-colors">
                      +{remainingCount}
                    </AvatarFallback>
                  </Avatar>
                </DialogTrigger>
              )}
              {participantCount === 0 && (
                <p className="text-sm text-muted-foreground pl-1">Seja o primeiro a confirmar!</p>
              )}
            </>
          )}
        </div>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{participantCount} Participantes Confirmados</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-72">
            <div className="space-y-4 pr-6">
              {participants.map((user) => (
                <UserProfileDialog key={user.id} user={user}>
                  <div className="flex items-center gap-4 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors">
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.bio}</p>
                    </div>
                  </div>
                </UserProfileDialog>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
