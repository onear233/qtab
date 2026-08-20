// 设置模块：右上角设置按钮与设置面板

import { settings, saveSettings } from './storage.js';
import { applyEngine } from './search.js';

// 通过 CSS 变量应用时钟缩放与面板模糊度
export function applyClockScale() {
  document.documentElement.style.setProperty('--clock-scale', settings.clockScale);
}

export function applyBlurScale() {
  document.documentElement.style.setProperty('--blur-scale', settings.blurScale);
}

export function initSettings() {
  applyClockScale();
  applyBlurScale();

  const settingsOverlay = document.getElementById('settings-overlay');
  const engineSelect = document.getElementById('engine-select');
  const clockSizeEl = document.getElementById('clock-size');
  const clockSizeValueEl = document.getElementById('clock-size-value');
  const blurScaleEl = document.getElementById('blur-scale');
  const blurScaleValueEl = document.getElementById('blur-scale-value');

  document.getElementById('settings-btn').addEventListener('click', () => {
    engineSelect.value = settings.engine;
    clockSizeEl.value = settings.clockScale;
    blurScaleEl.value = settings.blurScale;
    clockSizeValueEl.textContent = `${Math.round(settings.clockScale * 100)}%`;
    blurScaleValueEl.textContent = blurScaleEl.value;
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

  blurScaleEl.addEventListener('input', () => {
    settings.blurScale = Number(blurScaleEl.value);
    blurScaleValueEl.textContent = blurScaleEl.value;
    saveSettings();
    applyBlurScale();
  });

  // 点击遮罩空白处或按 Esc 关闭设置面板
  settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) settingsOverlay.classList.add('hidden');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') settingsOverlay.classList.add('hidden');
  });
}
