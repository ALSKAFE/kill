<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8" />
  <title>تقويم الحجز</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100 text-right">

  <div class="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-xl rounded-2xl">
    <div class="flex justify-between items-center mb-4">
      <button id="prevMonth" class="text-blue-600 font-bold text-lg">⟨</button>
      <h2 id="monthYear" class="text-lg font-bold"></h2>
      <button id="nextMonth" class="text-blue-600 font-bold text-lg">⟩</button>
    </div>

    <div id="calendar" class="grid grid-cols-7 gap-2 text-center text-sm font-medium">
      <!-- الأيام سيتم توليدها هنا -->
    </div>
  </div>

  <script>
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
      const startWeekday = start.weekday % 7; // 0 = أحد

      const bookings = loadBookings(year, month);

      monthYearEl.textContent = `${start.setLocale('ar').toFormat("LLLL yyyy")}`;

      // تعبئة فراغات البداية
      for (let i = 0; i < startWeekday; i++) {
        calendarEl.innerHTML += `<div></div>`;
      }

      for (let i = 1; i <= daysInMonth; i++) {
        const day = DateTime.local(year, month, i);
        const div = document.createElement("div");
        div.className = "bg-white rounded-lg shadow p-2 text-xs";

        const title = document.createElement("div");
        title.className = "font-bold mb-1 text-sm";
        title.textContent = day.toFormat("d");
        div.appendChild(title);

        ["صباح", "مساء"].forEach(slot => {
          const slotKey = `${i}-${slot}`;
          const booked = bookings[slotKey];
          const slotDiv = document.createElement("div");

          slotDiv.className = `rounded p-1 mt-1 cursor-pointer ${
            booked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          } hover:opacity-80 transition`;

          slotDiv.textContent = `${slot}${booked ? ` - ${booked}` : ""}`;

          slotDiv.onclick = () => {
            if (booked) return alert("هذا الموعد محجوز بالفعل.");
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

    window.onload = () => {
      renderCalendar(currentDate);
    };
  </script>
</body>
</html>
