// 快捷方式模块：节点树渲染、文件夹卡片、拖拽移动、右键菜单与对话框

import { items, saveItems, uid } from './storage.js';

const rootEl = document.getElementById('shortcuts');

// 记录已展开的文件夹（会话内保持状态）
const expandedFolders = new Set();

// 网址补全协议
function normalizeUrl(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// ===== 节点树操作 =====

// 按 id 查找节点，返回 { node, list, index }，list 为节点所在的数组
function locate(id, list = items) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) return { node: list[i], list, index: i };
    if (list[i].type === 'folder') {
      const found = locate(id, list[i].children);
      if (found) return found;
    }
  }
  return null;
}

// targetId 为 null 表示根级
function moveNode(id, targetId) {
  if (id === targetId) return false;
  const found = locate(id);
  if (!found) return false;

  let targetList = items;
  if (targetId) {
    const target = locate(targetId);
    if (!target || target.node.type !== 'folder') return false;
    // 禁止把文件夹拖进自身或其子孙文件夹
    if (found.node.type === 'folder' && locate(targetId, [found.node])) {
      return false;
    }
    targetList = target.node.children;
  }
  if (found.list === targetList) return false;

  found.list.splice(found.index, 1);
  targetList.push(found.node);
  saveItems();
  return true;
}

function removeNode(id) {
  const found = locate(id);
  if (!found) return;
  found.list.splice(found.index, 1);
  saveItems();
  render();
}

// ===== 渲染 =====

function render() {
  rootEl.replaceChildren();
  items.forEach((node) => rootEl.appendChild(renderNode(node)));
  rootEl.appendChild(renderAddButton(null));
}

// 快捷方式（link）卡片
function renderLink(node) {
  const link = document.createElement('a');
  link.className = 'shortcut';
  link.href = node.url;
  link.title = node.name;
  link.dataset.id = node.id;
  link.draggable = true;

  // 图标：优先使用站点 favicon，加载失败时回退为首字母
  const icon = document.createElement('div');
  icon.className = 'shortcut-icon';
  const img = document.createElement('img');
  try {
    img.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(node.url)}`;
  } catch {
    /* 忽略非法 URL */
  }
  img.alt = '';
  img.addEventListener('error', () => {
    img.remove();
    icon.textContent = (node.name[0] || '?').toUpperCase();
  });
  icon.appendChild(img);

  const label = document.createElement('span');
  label.className = 'shortcut-name';
  label.textContent = node.name;

  link.append(icon, label, renderRemoveButton(node.id));
  bindDrag(link, node.id);
  return link;
}

// 文件夹卡片：可展开/折叠，内部可嵌套
function renderFolder(node) {
  const expanded = expandedFolders.has(node.id);
  const card = document.createElement('div');
  card.className = `folder-card${expanded ? ' expanded' : ''}`;
  card.dataset.id = node.id;

  const head = document.createElement('div');
  head.className = 'shortcut folder-head';
  head.title = expanded ? '点击折叠' : '点击展开';

  const icon = document.createElement('div');
  icon.className = 'shortcut-icon folder-icon';
  icon.textContent = expanded ? '📂' : '📁';

  const label = document.createElement('span');
  label.className = 'shortcut-name';
  label.textContent = node.name;

  if (node.children.length > 0) {
    const count = document.createElement('span');
    count.className = 'folder-count';
    count.textContent = node.children.length;
    head.append(icon, label, count);
  } else {
    head.append(icon, label);
  }
  head.appendChild(renderRemoveButton(node.id));

  head.addEventListener('click', (e) => {
    if (e.target.closest('.shortcut-remove')) return;
    if (expanded) expandedFolders.delete(node.id);
    else expandedFolders.add(node.id);
    render();
  });

  card.appendChild(head);

  if (expanded) {
    const body = document.createElement('div');
    body.className = 'folder-body';
    node.children.forEach((child) => body.appendChild(renderNode(child)));
    body.appendChild(renderAddButton(node.id));
    bindDropZone(body, node.id);
    card.appendChild(body);
  }

  bindDrag(card, node.id);
  bindDropZone(head, node.id);
  if (expanded) bindDropZone(card, node.id); // 卡片内边距区域也可放置
  return card;
}

function renderNode(node) {
  return node.type === 'folder' ? renderFolder(node) : renderLink(node);
}

// 悬停时显示的删除按钮
function renderRemoveButton(id) {
  const btn = document.createElement('button');
  btn.className = 'shortcut-remove';
  btn.title = '删除';
  btn.textContent = '×';
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    removeNode(id);
  });
  return btn;
}

// “添加”按钮，parentId 为 null 时添加到根级
function renderAddButton(parentId) {
  const btn = document.createElement('button');
  btn.className = 'shortcut shortcut-add';
  btn.title = '添加快捷方式';
  const icon = document.createElement('div');
  icon.className = 'shortcut-icon';
  icon.textContent = '+';
  const label = document.createElement('span');
  label.className = 'shortcut-name';
  label.textContent = '添加';
  btn.append(icon, label);
  btn.addEventListener('click', async () => {
    const values = await showDialog({
      title: '添加快捷方式',
      fields: [
        { id: 'name', label: '名称', placeholder: '例如：GitHub' },
        { id: 'url', label: '网址', placeholder: '例如：github.com' },
      ],
      confirmText: '添加',
    });
    if (!values || !values.name || !values.url) return;
    const node = { id: uid(), type: 'link', name: values.name, url: normalizeUrl(values.url) };
    if (parentId) {
      const folder = locate(parentId);
      folder.node.children.push(node);
    } else {
      items.push(node);
    }
    saveItems();
    render();
  });
  return btn;
}

// ===== 拖拽 =====

let draggingId = null;

function bindDrag(el, id) {
  el.addEventListener('dragstart', (e) => {
    // 只响应自身开始的拖拽，避免展开文件夹内拖动子项时误触发
    if (e.target.closest('[data-id]') !== el) return;
    draggingId = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    el.classList.add('dragging');
  });
  el.addEventListener('dragend', () => {
    draggingId = null;
    el.classList.remove('dragging');
    clearDropHighlights();
  });
}

// 可放置区域：文件夹头部/内容区；根容器
function bindDropZone(el, folderId) {
  el.addEventListener('dragover', (e) => {
    if (!draggingId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    el.classList.add('drop-over');
  });
  el.addEventListener('dragleave', (e) => {
    if (!el.contains(e.relatedTarget)) el.classList.remove('drop-over');
  });
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    el.classList.remove('drop-over');
    if (draggingId && moveNode(draggingId, folderId)) {
      expandedFolders.add(folderId); // 放入后自动展开目标文件夹
      render();
    }
  });
}

rootEl.addEventListener('dragover', (e) => {
  // 悬停在文件夹内部时不触发根容器高亮
  if (draggingId && !e.target.closest('.folder-card')) {
    e.preventDefault();
    rootEl.classList.add('drop-over');
  }
});
rootEl.addEventListener('dragleave', (e) => {
  if (!rootEl.contains(e.relatedTarget)) rootEl.classList.remove('drop-over');
});
rootEl.addEventListener('drop', (e) => {
  e.preventDefault();
  rootEl.classList.remove('drop-over');
  if (draggingId && moveNode(draggingId, null)) render();
});

function clearDropHighlights() {
  document.querySelectorAll('.drop-over').forEach((el) => el.classList.remove('drop-over'));
}

// ===== 右键菜单 =====

const ctxMenu = document.createElement('div');
ctxMenu.id = 'ctx-menu';
ctxMenu.className = 'hidden';
document.body.appendChild(ctxMenu);

function showCtxMenu(x, y, entries) {
  ctxMenu.replaceChildren();
  entries.forEach(({ label, action }) => {
    const item = document.createElement('button');
    item.className = 'ctx-item';
    item.textContent = label;
    item.addEventListener('click', () => {
      hideCtxMenu();
      action();
    });
    ctxMenu.appendChild(item);
  });
  ctxMenu.classList.remove('hidden');
  // 防止菜单超出屏幕
  const rect = ctxMenu.getBoundingClientRect();
  ctxMenu.style.left = `${Math.min(x, window.innerWidth - rect.width - 8)}px`;
  ctxMenu.style.top = `${Math.min(y, window.innerHeight - rect.height - 8)}px`;
}

function hideCtxMenu() {
  ctxMenu.classList.add('hidden');
}

document.addEventListener('click', hideCtxMenu);
document.addEventListener('scroll', hideCtxMenu);
window.addEventListener('resize', hideCtxMenu);

// 新建文件夹对话框
async function createFolder(parentId) {
  const values = await showDialog({
    title: parentId ? '新建子文件夹' : '新建文件夹',
    fields: [{ id: 'name', label: '文件夹名称', placeholder: '例如：工作' }],
    confirmText: '创建',
  });
  if (!values || !values.name) return;
  const folder = { id: uid(), type: 'folder', name: values.name, children: [] };
  if (parentId) {
    const parent = locate(parentId);
    parent.node.children.push(folder);
    expandedFolders.add(parentId);
  } else {
    items.push(folder);
  }
  saveItems();
  render();
}

// 重命名节点
async function renameNode(id) {
  const found = locate(id);
  if (!found) return;
  const values = await showDialog({
    title: '重命名',
    fields: [{ id: 'name', label: '名称', value: found.node.name }],
    confirmText: '保存',
  });
  if (!values || !values.name) return;
  found.node.name = values.name;
  saveItems();
  render();
}

rootEl.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const cardEl = e.target.closest('[data-id]');

  if (!cardEl) {
    // 空白处：新建文件夹 / 添加快捷方式
    showCtxMenu(e.clientX, e.clientY, [
      { label: '新建文件夹', action: () => createFolder(null) },
      { label: '添加快捷方式', action: () => renderAddButton(null).click() },
    ]);
    return;
  }

  const id = cardEl.dataset.id;
  const found = locate(id);
  if (!found) return;

  if (found.node.type === 'folder') {
    showCtxMenu(e.clientX, e.clientY, [
      { label: '新建子文件夹', action: () => createFolder(id) },
      { label: '重命名', action: () => renameNode(id) },
      { label: '删除文件夹', action: () => removeNode(id) },
    ]);
  } else {
    showCtxMenu(e.clientX, e.clientY, [
      { label: '重命名', action: () => renameNode(id) },
      { label: '删除快捷方式', action: () => removeNode(id) },
    ]);
  }
});

// ===== 通用对话框 =====

// showDialog({ title, fields, confirmText }) => Promise<值对象 | null>
function showDialog({ title, fields, confirmText = '确定' }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    const panel = document.createElement('div');
    panel.className = 'panel';

    const heading = document.createElement('h2');
    heading.textContent = title;
    panel.appendChild(heading);

    const inputs = [];
    fields.forEach((field) => {
      const wrap = document.createElement('div');
      wrap.className = 'setting-item';
      const label = document.createElement('label');
      label.textContent = field.label;
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = field.placeholder || '';
      input.value = field.value || '';
      input.autocomplete = 'off';
      wrap.append(label, input);
      panel.appendChild(wrap);
      inputs.push(input);
    });

    const actions = document.createElement('div');
    actions.className = 'dialog-actions';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn';
    cancelBtn.textContent = '取消';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn primary';
    saveBtn.textContent = confirmText;
    actions.append(cancelBtn, saveBtn);
    panel.appendChild(actions);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    const finish = (result) => {
      overlay.remove();
      document.removeEventListener('keydown', onKeydown);
      resolve(result);
    };
    const submit = () => {
      const values = {};
      fields.forEach((field, i) => {
        values[field.id] = inputs[i].value.trim();
      });
      finish(values);
    };
    const onKeydown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        finish(null);
      } else if (e.key === 'Enter') {
        submit();
      }
    };

    cancelBtn.addEventListener('click', () => finish(null));
    saveBtn.addEventListener('click', submit);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) finish(null);
    });
    document.addEventListener('keydown', onKeydown, true);

    inputs[0].focus();
  });
}

export function initShortcuts() {
  render();
}
