// 简单的实时时钟
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString();
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