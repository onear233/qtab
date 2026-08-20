// 时钟模块：实时时间与日期显示

const timeEl = document.getElementById('time');
const secondsEl = document.getElementById('seconds');
const dateEl = document.getElementById('date');

function pad(n) {
  return String(n).padStart(2, '0');
}

function updateClock() {
  const now = new Date();
  timeEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  secondsEl.textContent = `:${pad(now.getSeconds())}`;
  dateEl.textContent = now.toLocaleDateString('zh-CN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function initClock() {
  setInterval(updateClock, 1000);
  updateClock();
}
