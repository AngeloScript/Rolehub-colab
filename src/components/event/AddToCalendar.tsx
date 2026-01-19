import { Button } from "@/components/ui/button";
import { CalendarCheck, Download } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AddToCalendarProps {
    event: {
        title: string;
        description: string;
        location: string;
        date: string; // ISO string
        time: string; // HH:mm
    };
}

export function AddToCalendar({ event }: AddToCalendarProps) {
    const getDates = () => {
        try {
            // Combine date and time
            // Assuming event.date is "YYYY-MM-DD" or ISO, and time is "HH:mm"
            // If event.date is full ISO, use it directly
            let start = new Date(event.date);
            const [hours, minutes] = event.time.split(':').map(Number);

            // If the date object invalid (e.g. just YYYY-MM-DD), set time on it
            // Adjust to local time logic if needed, but for links usually UTC or floating is trickier
            // Let's create a date object
            if (event.date.includes('T')) {
                start = new Date(event.date);
            } else {
                // Manual parse for YYYY-MM-DD to avoid timezone shifts
                const [y, m, d] = event.date.split('-').map(Number);
                start = new Date(y, m - 1, d, hours, minutes);
            }

            const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hours duration

            return { start, end };
        } catch (e) {
            console.error("Date parse error", e);
            return { start: new Date(), end: new Date() };
        }
    };

    const googleCalendarUrl = () => {
        const { start, end } = getDates();
        const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

        const url = new URL("https://www.google.com/calendar/render");
        url.searchParams.append("action", "TEMPLATE");
        url.searchParams.append("text", event.title);
        url.searchParams.append("details", event.description || "");
        url.searchParams.append("location", event.location);
        url.searchParams.append("dates", `${formatDate(start)}/${formatDate(end)}`);

        return url.toString();
    };

    const downloadIcs = () => {
        const { start, end } = getDates();
        const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

        const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Rolehub//NONSGML v1.0//EN
BEGIN:VEVENT
UID:${new Date().getTime()}@rolehub.app
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, "\\n")}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`.trim();

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <CalendarCheck className="w-4 h-4" />
                    Adicionar à Agenda
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.open(googleCalendarUrl(), '_blank')}>
                    Google Calendar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadIcs}>
                    <Download className="w-3 h-3 mr-2" />
                    Baixar .ics (Apple/Outlook)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
