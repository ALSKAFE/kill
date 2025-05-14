const DateTime = luxon.DateTime;
let currentDate = DateTime.now();

const calendarEl = document.getElementById("calendar");
const monthYearEl = document.getElementById("monthYear");

function loadBookings(year, month) {
  return JSON.parse(localStorage.getItem(`bookings-${year}-${month}`)) || {};
}

function saveBookings(year, month, bookings) {
  localStorage.setItem(`bookings-${year}-${month}`, JSON.stringify(bookings));
}

function renderCalendar(date) {
  calendarEl.innerHTML = "";
  const year = date.year;
  const month = date.month;
  const start = DateTime.local(year, month, 1);
  const daysInMonth = start.daysInMonth;
  const bookings = loadBookings(year, month);

  monthYearEl.textContent = `${start.setLocale('ar').toFormat("LLLL yyyy")}`;

  for (let i = 1; i <= daysInMonth; i++) {
    const day = DateTime.local(year, month, i);
    const div = document.createElement("div");
    div.className = "day";

    const title = document.createElement("h3");
    title.textContent = day.toFormat("d");
    div.appendChild(title);

    ["صباح", "مساء"].forEach(slot => {
      const slotKey = `${i}-${slot}`;
      const booked = bookings[slotKey];
      const slotDiv = document.createElement("div");
      slotDiv.className = "slot";
      if (booked) slotDiv.classList.add("booked");
      slotDiv.textContent = `${slot}${booked ? ` - محجوز (${booked})` : ""}`;

      slotDiv.onclick = () => {
        if (slotDiv.classList.contains("booked")) return;

        const name = prompt("أدخل اسم المستأجر:");
        if (!name) return;

        bookings[slotKey] = name;
        saveBookings(year, month, bookings);
        renderCalendar(date);
      };

      div.appendChild(slotDiv);
    });

    calendarEl.appendChild(div);
  }
}

document.getElementById("prevMonth").onclick = () => {
  currentDate = currentDate.minus({ months: 1 });
  renderCalendar(currentDate);
};

document.getElementById("nextMonth").onclick = () => {
  currentDate = currentDate.plus({ months: 1 });
  renderCalendar(currentDate);
};

// افتح دائمًا على الشهر الحالي
window.onload = () => {
  renderCalendar(currentDate);
};
