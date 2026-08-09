"use client";
import { useState } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface CalendarViewProps {
  contracts: any[];
}

// Dates come from the server as UTC-midnight timestamps. Comparing them
// directly with the browser's local calendar day can shift them by a day
// (e.g. Argentina is UTC-3), so we re-anchor to the UTC calendar date.
function toCalendarDate(value: string | Date) {
  const d = new Date(value);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export default function CalendarView({ contracts }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="card !p-0 overflow-hidden shadow-2xl animate-fade-in">
      {/* Header del Calendario */}
      <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white capitalize">
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">Mapa mensual de compromisos</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button onClick={prevMonth} className="btn btn-secondary !p-2 rounded-full">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="btn btn-secondary !px-4 !text-xs">
            Hoy
          </button>
          <button onClick={nextMonth} className="btn btn-secondary !p-2 rounded-full">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Grid del Calendario — scroll horizontal en pantallas chicas */}
      <div className="overflow-x-auto">
      <div className="min-w-[620px]">
      <div className="grid grid-cols-7 border-b border-white/5">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
          <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] bg-white/5 border-r border-white/5 last:border-0 italic">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayContracts = contracts.filter(c => isSameDay(toCalendarDate(c.expirationDate), day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={day.toString()} 
              className={`min-h-[120px] p-2 border-r border-b border-white/5 transition-all hover:bg-white/[0.02] relative
                ${!isCurrentMonth ? 'opacity-20 grayscale' : ''}
                ${isToday ? 'bg-blue-500/5' : ''}
              `}
            >
              <span className={`text-xs font-bold ${isToday ? 'text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full' : 'text-[var(--text-muted)]'}`}>
                {format(day, "d")}
              </span>
              
              <div className="flex flex-col gap-1 mt-2">
                {dayContracts.slice(0, 3).map(c => (
                  <div 
                    key={c.id} 
                    className="text-[10px] p-1.5 rounded bg-white/5 border-l-2 border-blue-500 text-white truncate shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                    title={`${c.client.name}: ${c.serviceBase.name}`}
                  >
                    <span className="font-bold opacity-70">@{c.client.name.split(' ')[0]}</span> {c.serviceBase.name}
                  </div>
                ))}
                {dayContracts.length > 3 && (
                  <div className="text-[9px] text-center text-blue-400 font-bold py-1 bg-blue-500/10 rounded">
                    +{dayContracts.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
      </div>
    </div>
  );
}
