/**
 * Simulates exactly what BookingCalendar does to compute slots.
 * This helps us see if the slot generation logic is correct for today's date.
 */

const { addMinutes, parseISO, startOfToday, format } = require('date-fns');

// Availability from DB for product 560
const availability = [
  { day_of_week: 0, start_time: "09:00:00", end_time: "17:00:00", slot_duration: 60 },
  { day_of_week: 1, start_time: "09:00:00", end_time: "17:00:00", slot_duration: 60 },
  { day_of_week: 2, start_time: "09:00:00", end_time: "17:00:00", slot_duration: 60 },
  { day_of_week: 3, start_time: "09:00:00", end_time: "17:00:00", slot_duration: 60 },
  { day_of_week: 4, start_time: "09:00:00", end_time: "17:00:00", slot_duration: 60 },
];

// Simulate with today's date
const today = new Date();
console.log('Today:', today.toString());
console.log('Day of week:', today.getDay()); // 0=Sun, 1=Mon, ..., 6=Sat

// Try next 7 days
for (let i = 0; i < 7; i++) {
  const selectedDate = new Date(today);
  selectedDate.setDate(today.getDate() + i);
  selectedDate.setHours(0, 0, 0, 0);
  
  const dayOfWeek = selectedDate.getDay();
  const dayAvail = availability.find((a) => a.day_of_week === dayOfWeek);
  
  if (!dayAvail) {
    console.log(`  Day +${i} (${format(selectedDate, 'EEE MMM do')}): No availability configured`);
    continue;
  }
  
  const availableSlots = [];
  const [startH, startM] = dayAvail.start_time.split(":").map(Number);
  const [endH, endM] = dayAvail.end_time.split(":").map(Number);
  
  let current = new Date(selectedDate);
  current.setHours(startH, startM, 0, 0);
  
  const endTime = new Date(selectedDate);
  endTime.setHours(endH, endM, 0, 0);
  
  let totalSlots = 0;
  let futureSlots = 0;
  
  while (current < endTime) {
    const slotEnd = addMinutes(current, dayAvail.slot_duration || 60);
    totalSlots++;
    if (current > new Date()) {
      futureSlots++;
      availableSlots.push(format(current, 'h:mm a'));
    }
    current = slotEnd;
  }
  
  console.log(`  Day +${i} (${format(selectedDate, 'EEE MMM do')}): ${totalSlots} total slots, ${futureSlots} future slots`);
  if (futureSlots > 0) {
    console.log(`    Slots: ${availableSlots.slice(0, 3).join(', ')}...`);
  }
}
