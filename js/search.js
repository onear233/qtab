// 搜索模块：搜索引擎切换与搜索跳转

import { settings } from './storage.js';

// 支持的搜索引擎
const ENGINES = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
  baidu: { name: '百度', url: 'https://www.baidu.com/s?wd=' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
};

const searchEl = document.getElementById('search');

export function applyEngine() {
  const engine = ENGINES[settings.engine] || ENGINES.google;
  searchEl.placeholder = `使用 ${engine.name} 搜索...`;
}

export function initSearch() {
  applyEngine();
  searchEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const engine = ENGINES[settings.engine] || ENGINES.google;
      window.location.href = engine.url + encodeURIComponent(e.target.value.trim());
    }
  });
}
