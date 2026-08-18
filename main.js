// 背景图片列表（Chrome 无法在运行时列出目录内容，新增图片后需在此添加文件名）
const BACKGROUNDS = [
  'Background/b1.png',
  'Background/b2.jpg',
];

// 随机选取一张作为背景
const bg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
document.body.style.backgroundImage = `url("${bg}")`;

// ===== 设置的读取与保存 =====
const SETTINGS_KEY = 'qtab-settings';
const SHORTCUTS_KEY = 'qtab-shortcuts';

const DEFAULT_SETTINGS = {
  engine: 'google',
  clockScale: 1,
};

// 支持的搜索引擎
const ENGINES = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
  baidu: { name: '百度', url: 'https://www.baidu.com/s?wd=' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

let settings = { ...DEFAULT_SETTINGS, ...loadJSON(SETTINGS_KEY, {}) };
let shortcuts = loadJSON(SHORTCUTS_KEY, []);

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function saveShortcuts() {
  localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcuts));
}

// ===== 实时时钟 =====
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

// 应用时钟大小（通过 CSS 变量缩放）
function applyClockScale() {
  document.documentElement.style.setProperty('--clock-scale', settings.clockScale);
}
applyClockScale();

// ===== 搜索 =====
const searchEl = document.getElementById('search');

function applyEngine() {
  const engine = ENGINES[settings.engine] || ENGINES.google;
  searchEl.placeholder = `使用 ${engine.name} 搜索...`;
}
applyEngine();

searchEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.value.trim()) {
    const engine = ENGINES[settings.engine] || ENGINES.google;
    window.location.href = engine.url + encodeURIComponent(e.target.value.trim());
  }
});

// ===== 网页快捷方式 =====
const shortcutsEl = document.getElementById('shortcuts');

// 网址补全协议
function normalizeUrl(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function renderShortcuts() {
  shortcutsEl.innerHTML = '';

  shortcuts.forEach((item, index) => {
    const link = document.createElement('a');
    link.className = 'shortcut';
    link.href = item.url;
    link.title = item.name;

    // 图标：优先使用站点 favicon，加载失败时回退为首字母
    const icon = document.createElement('div');
    icon.className = 'shortcut-icon';
    const img = document.createElement('img');
    try {
      img.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(item.url)}`;
    } catch {
      /* 忽略非法 URL */
    }
    img.alt = '';
    img.addEventListener('error', () => {
      img.remove();
      icon.textContent = (item.name[0] || '?').toUpperCase();
    });
    icon.appendChild(img);

    const label = document.createElement('span');
    label.className = 'shortcut-name';
    label.textContent = item.name;

    // 删除按钮（悬停时显示）
    const removeBtn = document.createElement('button');
    removeBtn.className = 'shortcut-remove';
    removeBtn.title = '删除';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      shortcuts.splice(index, 1);
      saveShortcuts();
      renderShortcuts();
    });

    link.append(icon, label, removeBtn);
    shortcutsEl.appendChild(link);
  });

  // 添加按钮
  const addBtn = document.createElement('button');
  addBtn.className = 'shortcut shortcut-add';
  addBtn.title = '添加快捷方式';
  addBtn.innerHTML =
    '<div class="shortcut-icon">+</div><span class="shortcut-name">添加</span>';
  addBtn.addEventListener('click', openShortcutDialog);
  shortcutsEl.appendChild(addBtn);
}
renderShortcuts();

// ===== 添加快捷方式对话框 =====
const shortcutOverlay = document.getElementById('shortcut-overlay');
const shortcutNameEl = document.getElementById('shortcut-name');
const shortcutUrlEl = document.getElementById('shortcut-url');

function openShortcutDialog() {
  shortcutNameEl.value = '';
  shortcutUrlEl.value = '';
  shortcutOverlay.classList.remove('hidden');
  shortcutNameEl.focus();
}

function closeShortcutDialog() {
  shortcutOverlay.classList.add('hidden');
}

function saveShortcut() {
  const name = shortcutNameEl.value.trim();
  const url = shortcutUrlEl.value.trim();
  if (!name || !url) return;
  shortcuts.push({ name, url: normalizeUrl(url) });
  saveShortcuts();
  renderShortcuts();
  closeShortcutDialog();
}

document.getElementById('shortcut-save').addEventListener('click', saveShortcut);
document.getElementById('shortcut-cancel').addEventListener('click', closeShortcutDialog);
shortcutUrlEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveShortcut();
});

// ===== 设置面板 =====
const settingsOverlay = document.getElementById('settings-overlay');
const engineSelect = document.getElementById('engine-select');
const clockSizeEl = document.getElementById('clock-size');
const clockSizeValueEl = document.getElementById('clock-size-value');

document.getElementById('settings-btn').addEventListener('click', () => {
  engineSelect.value = settings.engine;
  clockSizeEl.value = settings.clockScale;
  clockSizeValueEl.textContent = `${Math.round(settings.clockScale * 100)}%`;
  settingsOverlay.classList.remove('hidden');
});

document.getElementById('settings-close').addEventListener('click', () => {
  settingsOverlay.classList.add('hidden');
});

engineSelect.addEventListener('change', () => {
  settings.engine = engineSelect.value;
  saveSettings();
  applyEngine();
});

clockSizeEl.addEventListener('input', () => {
  settings.clockScale = Number(clockSizeEl.value);
  clockSizeValueEl.textContent = `${Math.round(settings.clockScale * 100)}%`;
  saveSettings();
  applyClockScale();
});

// 点击遮罩空白处或按 Esc 关闭弹层
[settingsOverlay, shortcutOverlay].forEach((overlay) => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    settingsOverlay.classList.add('hidden');
    shortcutOverlay.classList.add('hidden');
  }
});
