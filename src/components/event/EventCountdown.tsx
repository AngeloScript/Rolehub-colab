import { useState, useEffect } from 'react';
import { differenceInSeconds, intervalToDuration, Duration } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Timer } from 'lucide-react';

interface EventCountdownProps {
    eventDate: string; // ISO string or date string
    eventTime?: string;
}

export function EventCountdown({ eventDate, eventTime = "00:00" }: EventCountdownProps) {
    const [timeLeft, setTimeLeft] = useState<Duration | null>(null);
    const [isHappening, setIsHappening] = useState(false);
    const [isPast, setIsPast] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            // Construct date object carefully
            // Assuming eventDate is "YYYY-MM-DD" or ISO, and time is "HH:MM"
            let targetDate = new Date(eventDate);

            // If eventDate is just "DD MMM" (display format), we need the full date.
            // Ideally pass the full ISO date string to this component.
            // If passing ISO string directly:
            if (eventDate.includes('T')) {
                targetDate = new Date(eventDate);
            } else {
                // Fallback or handle other formats if necessary
                // For now assuming ISO or full date string is passed
                const [hours, minutes] = eventTime.split(':').map(Number);
                targetDate.setHours(hours || 0, minutes || 0, 0, 0);
            }

            const now = new Date();
            const diffInSeconds = differenceInSeconds(targetDate, now);

            if (diffInSeconds < 0) {
                // Event started or passed
                // Assuming event lasts 4 hours for "happening now" logic, adjust as needed
                if (diffInSeconds > -14400) {
                    setIsHappening(true);
                    setIsPast(false);
                } else {
                    setIsHappening(false);
                    setIsPast(true);
                }
                setTimeLeft(null);
                return;
            }

            setIsHappening(false);
            setIsPast(false);

            const duration = intervalToDuration({
                start: now,
                end: targetDate,
            });

            setTimeLeft(duration);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [eventDate, eventTime]);

    if (isPast) return null;

    if (isHappening) {
        return (
            <Card className="bg-primary/10 border-primary/20 animate-pulse">
                <CardContent className="p-4 flex items-center justify-center gap-2 text-primary font-bold">
                    <Timer className="w-5 h-5" />
                    Rolando agora! 🔥
                </CardContent>
            </Card>
        )
    }

    if (!timeLeft) return null;

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    Contagem Regressiva
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-4 gap-2 text-center">
                    {timeLeft.days !== undefined && timeLeft.days > 0 && (
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold">{timeLeft.days}</span>
                            <span className="text-xs text-muted-foreground">dias</span>
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold">{String(timeLeft.hours || 0).padStart(2, '0')}</span>
                        <span className="text-xs text-muted-foreground">hrs</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold">{String(timeLeft.minutes || 0).padStart(2, '0')}</span>
                        <span className="text-xs text-muted-foreground">min</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold">{String(timeLeft.seconds || 0).padStart(2, '0')}</span>
                        <span className="text-xs text-muted-foreground">seg</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
