// 存储层：设置与快捷方式树的读写、数据迁移

export const SETTINGS_KEY = 'qtab-settings';
export const SHORTCUTS_KEY = 'qtab-shortcuts';

export const DEFAULT_SETTINGS = {
  engine: 'google',
  clockScale: 1,
  blurScale: 99,
};

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// 旧版数据是 [{name, url}] 扁平数组，迁移为带 type/id 的节点树
function migrateNode(node) {
  const migrated = { id: node.id || uid(), ...node };
  if (migrated.type === 'folder') {
    migrated.children = Array.isArray(node.children)
      ? node.children.map(migrateNode)
      : [];
  } else {
    migrated.type = 'link';
    migrated.url = node.url || '';
  }
  return migrated;
}

export const settings = { ...DEFAULT_SETTINGS, ...loadJSON(SETTINGS_KEY, {}) };

// 快捷方式节点树（link / folder 两种类型，folder 可无限嵌套）
export const items = loadJSON(SHORTCUTS_KEY, []).map(migrateNode);

export function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function saveItems() {
  localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(items));
}
