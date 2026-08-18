// 背景图片列表（Chrome 无法在运行时列出目录内容，新增图片后需在此添加文件名）
const BACKGROUNDS = [
  'Background/b1.png',
  'Background/b2.jpg',
];

// 随机选取一张作为背景
const bg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
document.body.style.backgroundImage = `url("${bg}")`;

// 实时时钟
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
setInterval(updateClock, 1000);
updateClock();

// 绑定搜索输入框
document.getElementById('search').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const query = encodeURIComponent(e.target.value);
    window.location.href = `https://www.google.com/search?q=${query}`;
  }
});
