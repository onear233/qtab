// 入口：随机背景 + 初始化各功能模块

import { initClock } from './js/clock.js';
import { initSearch } from './js/search.js';
import { initSettings } from './js/settings.js';
import { initShortcuts } from './js/shortcuts.js';

// 背景图片列表（Chrome 无法在运行时列出目录内容，新增图片后需在此添加文件名）
const BACKGROUNDS = [
  'Background/b1.png',
  'Background/b2.jpg',
];

// 随机选取一张作为背景
const bg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
document.body.style.backgroundImage = `url("${bg}")`;

initClock();
initSearch();
initSettings();
initShortcuts();
