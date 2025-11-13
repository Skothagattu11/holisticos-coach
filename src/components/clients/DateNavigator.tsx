import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateNavigatorProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export const DateNavigator = ({ date, onDateChange }: DateNavigatorProps) => {
  const handlePrevDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="flex items-center gap-2 bg-card border rounded-lg p-2">
      <Button variant="outline" size="icon" onClick={handlePrevDay}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "min-w-[240px] justify-start text-left font-normal"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(date, "PPPP")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => newDate && onDateChange(newDate)}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="icon" onClick={handleNextDay}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button variant="outline" onClick={handleToday}>
        Today
      </Button>
    </div>
  );
};
