document.addEventListener("DOMContentLoaded", function() {

const schedule60 = [
  {start:"08:30",end:"09:30"},
  {start:"09:40",end:"10:40"},
  {start:"10:55",end:"11:55"},
  {start:"12:50",end:"13:50"},
  {start:"14:00",end:"15:00"}
];

const schedule75 = [
  {start:"08:15",end:"09:40"},
  {start:"10:55",end:"12:10"},
  {start:"12:35",end:"13:50"},
  {start:"14:00",end:"15:15"}
];

// Samstag DELF-Kurse
const scheduleSaturday = [
  { start: "09:00", end: "10:00", label: "DELF Vorbereitungskurs 1" },
  { start: "10:00", end: "11:00", label: "DELF Vorbereitungskurs 2" }
];

const toggles = {1:false,3:false,4:false,5:false};

function $(id){ return document.getElementById(id); }

const timeText      = $("timeText");
const progressInner = $("progressInner");
const progressLabel = $("progressLabel");
const nextHourLabel = $("nextHourLabel");
const resetBtn      = $("reset");
const stundenBtns   = document.querySelectorAll(".stundenBtn");

function pad(n){ return n.toString().padStart(2,"0"); }

function parseTime(str){
  const [h,m] = str.split(":").map(Number);
  const d = new Date();
  d.setHours(h,m,0,0);
  return d;
}

function getActiveInterval() {
  const now = new Date();
  const day = now.getDay(); // 0=So, 6=Sa

  // Samstag DELF
  if (day === 6) {
    for (let i = 0; i < scheduleSaturday.length; i++) {
      const s = scheduleSaturday[i];
      const start = parseTime(s.start);
      const end = parseTime(s.end);
      if (now >= start && now <= end) {
        return { start, end, idx: 100 + i, customLabel: s.label };
      }
    }

    // Samstag Pausenregel: 09–11
    const pauseStart = parseTime("09:00");
    const pauseEnd = parseTime("11:00");
    if (now >= pauseStart && now <= pauseEnd) {
      return { start: now, end: now, idx: 0, isPause: true };
    }

    return null;
  }

  // Montag–Freitag: normaler Unterricht
  for (let i = 0; i < schedule60.length; i++) {
    let s60 = schedule60[i];
    let s75 = schedule75[[1,3,4,5].indexOf(i+1)];

    const interval = (toggles[i+1] && s75) ? s75 : s60;
    if (!interval) continue;

    const start = parseTime(interval.start);
    const end   = parseTime(interval.end);

    if (now >= start && now <= end) {
      return { start, end, idx: i+1 };
    }
  }

  // Montag–Freitag Pausenregel 08:15–15:30
  const pauseStart = parseTime("08:15");
  const pauseEnd   = parseTime("15:30");

  if (now >= pauseStart && now <= pauseEnd) {
    return { start: now, end: now, idx: 0, isPause: true };
  }

  return null;
}

function update() {
  const interval = getActiveInterval();
  const now = new Date();

  if (!interval){
    timeText.textContent = "--:--";
    progressInner.style.width = "0%";
    progressLabel.textContent = "Außerhalb des Stundenplans";
    nextHourLabel.textContent = "";
    return;
  }

  if(interval.isPause){
    timeText.textContent = "PAUSE";
    progressInner.style.width = "0%";
    progressLabel.textContent = "Keine aktive Stunde";
    nextHourLabel.textContent = "";
    return;
  }

  // DELF Kurse Samstag
  if (interval.customLabel) {
    const total = interval.end - interval.start;
    const elapsed = now - interval.start;
    const remaining = interval.end - now;

    let percent = (elapsed / total) * 100;
    percent = Math.min(100, Math.max(0, percent));
    progressInner.style.width = percent + "%";

    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);

    timeText.textContent = `${pad(mins)}:${pad(secs)}`;
    progressLabel.textContent = interval.customLabel;
    nextHourLabel.textContent = `Ende: ${pad(interval.end.getHours())}:${pad(interval.end.getMinutes())}`;
    return;
  }

  // Normaler Unterricht
  const total = interval.end - interval.start;
  const elapsed = now - interval.start;
  const remaining = interval.end - now;

  let percent = (elapsed / total) * 100;
  percent = Math.min(100, Math.max(0, percent));
  progressInner.style.width = percent + "%";

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  timeText.textContent = `${pad(mins)}:${pad(secs)}`;
  progressLabel.textContent = Math.round(percent) + "% der Stunde";
  nextHourLabel.textContent = `Ende: ${pad(interval.end.getHours())}:${pad(interval.end.getMinutes())}`;
}

setInterval(update, 250);
update();

// Reset Button
if(resetBtn){
  resetBtn.addEventListener("click", update);
}

// Toggle 60/75
stundenBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const nr = parseInt(btn.dataset.stunde);
    toggles[nr] = !toggles[nr];
    btn.textContent = `${nr}. Stunde: ${toggles[nr] ? "75" : "60"}`;
    update();
  });
});

});