import "./MonthlyCalendar.css";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MonthlyCalendar({ workoutDates, year, month, onDayClick }) {
  const workoutSet = new Set(workoutDates);

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const today = new Date();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="cal-root">
      <div className="cal-header">
        {DAY_NAMES.map((d) => (
          <span key={d} className="cal-day-name">{d}</span>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((day, i) => {
          if (!day) return <span key={`e${i}`} className="cal-cell empty" />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isWorkout = workoutSet.has(dateStr);
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;

          return (
            <span
              key={day}
              className={["cal-cell", isWorkout ? "workout" : "", isToday ? "today" : ""].filter(Boolean).join(" ")}
              onClick={isWorkout && onDayClick ? () => onDayClick(dateStr) : undefined}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}
