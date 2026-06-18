import { draw } from './lottery.js';
import { parseNames } from './file-import.js';
import { AnimationEngine } from './animation.js';
import { initAudio } from './audio.js';

const state = {
  lists: {},
  activeKey: null,
  settings: {
    drawCount: 1,
    allowRepeat: false
  },
  phase: 'idle'
};

let animEngine = null;

function activeList() {
  if (!state.activeKey || !state.lists[state.activeKey]) return null;
  return state.lists[state.activeKey];
}

function ensureActive() {
  if (!activeList()) {
    const keys = Object.keys(state.lists);
    if (keys.length > 0) {
      state.activeKey = keys[0];
    }
  }
}

// ======== 构建 UI ========
function buildUI() {
  document.getElementById('app').innerHTML = `
    <div class="titlebar">
      <div class="dot"></div>
      <span class="label">LOTTERY SYSTEM</span>
    </div>
    <div class="main-content">

      <!-- 左面板：控制 + 记录 -->
      <div id="left-panel" class="panel">
        <div class="panel-title">抽选控制</div>
        <div id="file-drop" class="file-drop-zone">点击导入名单 (.txt / .csv / .xlsx)</div>
        <div class="param-row">
          <span class="param-label">抽取人数</span>
          <input id="draw-count" class="param-input" type="number" min="1" value="1">
        </div>
        <label class="checkbox-row">
          <input id="allow-repeat" type="checkbox">
          <span>允许重复抽取</span>
        </label>
        <div id="warning-msg" class="warning-msg"></div>
        <button id="btn-draw" class="btn-draw">开始抽取</button>
        <button id="btn-reset" class="btn-reset">重置本轮</button>
        <div class="panel-title" style="margin-top:12px;border-top:1px solid #1a2a2a;padding-top:12px;">中奖记录</div>
        <div id="winner-list" class="winner-list">
          <div class="empty-state">暂无记录</div>
        </div>
      </div>

      <!-- 中央：动画展示 -->
      <div id="center-panel">
        <div id="animation-stage" class="animation-stage"></div>
      </div>

      <!-- 右面板：多名名单管理 -->
      <div id="right-panel" class="panel">
        <div class="panel-title">名单库</div>
        <div id="list-selector" class="list-selector">
          <div class="empty-state">导入名单后显示</div>
        </div>
        <div class="stats">
          <div class="stats-row"><span>总人数</span><span id="stat-total" class="val">0</span></div>
          <div class="stats-row"><span>已抽取</span><span id="stat-drawn" class="val">0</span></div>
        </div>
        <div id="name-list" class="name-list-preview">
          <div class="empty-state">选择名单后显示</div>
        </div>
        <button id="btn-delete-list" class="btn-clear">删除此名单</button>
      </div>

    </div>`;
}

// ======== 事件绑定 ========
function bindEvents() {
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => e.preventDefault());

  const fileDrop = document.getElementById('file-drop');
  fileDrop.addEventListener('click', handleImport);
  fileDrop.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileDrop.classList.add('drag-over');
  });
  fileDrop.addEventListener('dragleave', () => {
    fileDrop.classList.remove('drag-over');
  });
  fileDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileDrop.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileImport(window.electronAPI.getFilePath(file));
    }
  });

  document.getElementById('btn-draw').addEventListener('click', handleDraw);
  document.getElementById('btn-reset').addEventListener('click', handleReset);
  document.getElementById('btn-delete-list').addEventListener('click', handleDeleteList);
  document.getElementById('draw-count').addEventListener('input', (e) => {
    state.settings.drawCount = Math.max(1, parseInt(e.target.value) || 1);
    updateStats();
  });
  document.getElementById('allow-repeat').addEventListener('change', (e) => {
    state.settings.allowRepeat = e.target.checked;
    updateStats();
  });
}

// ======== 导入 ========
async function handleImport() {
  try {
    const result = await window.electronAPI.importNames();
    if (!result) return;
    applyImportedNames(result);
  } catch (err) {
    console.error('导入失败:', err);
  }
}

async function handleFileImport(filePath) {
  try {
    const result = await window.electronAPI.importNamesByPath(filePath);
    if (!result) return;
    applyImportedNames(result);
  } catch (err) {
    console.error('导入失败:', err);
  }
}

function applyImportedNames(result) {
  const fileType = result.filePath.match(/\.(csv|xlsx)/i) ? 'csv' : 'txt';
  const names = parseNames(result.content, fileType);
  if (names.length === 0) return;

  // 用文件名（不含扩展名）作为列表 key
  const filename = result.filePath.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '');
  state.lists[filename] = { nameList: names, drawnList: [] };
  state.activeKey = filename;

  saveState();
  refreshAll();
}

// ======== 抽取 ========
async function handleDraw() {
  const list = activeList();
  if (state.phase !== 'idle' || !list || list.nameList.length === 0) return;

  const remaining = list.nameList.length - list.drawnList.length;
  if (!state.settings.allowRepeat && remaining <= 0) return;

  let count = state.settings.drawCount;
  if (!state.settings.allowRepeat && count > remaining) {
    count = remaining;
  }

  const pool = state.settings.allowRepeat
    ? list.nameList
    : list.nameList.filter(n => !list.drawnList.includes(n));

  const winners = draw(pool, count, false);

  state.phase = 'animating';
  const btn = document.getElementById('btn-draw');
  btn.disabled = true;
  btn.textContent = '抽取中...';

  animEngine = new AnimationEngine(document.getElementById('animation-stage'));
  animEngine.clear();

  for (let i = 0; i < winners.length; i++) {
    await animEngine.revealName(winners[i]);
    if (i < winners.length - 1) {
      await sleep(1000);
    }
  }

  list.drawnList.push(...winners);
  saveState();
  state.phase = 'idle';
  btn.disabled = false;
  btn.textContent = '开始抽取';
  updateStats();
  updateWinnerList();
}

// ======== 列表选择 ========
function switchList(key) {
  state.activeKey = key;
  saveState();
  animEngine.clear();
  refreshAll();
}

function handleDeleteList() {
  if (!state.activeKey || !state.lists[state.activeKey]) return;
  if (state.phase !== 'idle') return;
  delete state.lists[state.activeKey];
  state.activeKey = Object.keys(state.lists)[0] || null;
  saveState();
  animEngine.clear();
  refreshAll();
}

// ======== 辅助函数 ========
function updateStats() {
  const list = activeList();
  const total = list ? list.nameList.length : 0;
  const drawn = list ? list.drawnList.length : 0;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-drawn').textContent = drawn;

  const remaining = total - drawn;
  const count = state.settings.drawCount;
  const allowRepeat = state.settings.allowRepeat;
  const btn = document.getElementById('btn-draw');
  const warn = document.getElementById('warning-msg');

  if (!list || total === 0) {
    btn.disabled = true;
    warn.textContent = '请先导入名单';
    warn.style.display = 'block';
  } else if (!allowRepeat && count > remaining) {
    btn.disabled = true;
    warn.textContent = remaining <= 0
      ? '所有人已抽完，请重置本轮'
      : `抽取人数(${count})超过剩余可抽人数(${remaining})`;
    warn.style.display = 'block';
  } else if (allowRepeat && count > total) {
    btn.disabled = true;
    warn.textContent = `抽取人数(${count})超过名单总人数(${total})`;
    warn.style.display = 'block';
  } else {
    btn.disabled = false;
    warn.style.display = 'none';
  }
}

function updateListSelector() {
  const el = document.getElementById('list-selector');
  const keys = Object.keys(state.lists);
  if (keys.length === 0) {
    el.innerHTML = '<div class="empty-state">导入名单后显示</div>';
    return;
  }
  el.innerHTML = keys.map(key => {
    const l = state.lists[key];
    const active = key === state.activeKey ? ' active' : '';
    return `<div class="list-item${active}" data-key="${escHtml(key)}">
      <span class="list-item-name">${escHtml(key)}</span>
      <span class="list-item-count">${l.nameList.length}人</span>
    </div>`;
  }).join('');

  el.querySelectorAll('.list-item').forEach(item => {
    item.addEventListener('click', () => {
      switchList(item.dataset.key);
    });
  });
}

function updateNameListPreview() {
  const el = document.getElementById('name-list');
  const list = activeList();
  if (!list || list.nameList.length === 0) {
    el.innerHTML = '<div class="empty-state">选择名单后显示</div>';
    return;
  }
  el.innerHTML = list.nameList.map((name, i) =>
    `<div class="name-item">
      <span>${escHtml(name)}</span>
      <span class="delete-btn" data-index="${i}">&times;</span>
    </div>`
  ).join('');

  el.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index);
      const cur = activeList();
      if (!cur) return;
      const removedName = cur.nameList[idx];
      cur.nameList.splice(idx, 1);
      cur.drawnList = cur.drawnList.filter(n => n !== removedName);
      saveState();
      refreshAll();
    });
  });
}

function updateWinnerList() {
  const el = document.getElementById('winner-list');
  const list = activeList();
  if (!list || list.drawnList.length === 0) {
    el.innerHTML = '<div class="empty-state">暂无记录</div>';
    return;
  }
  el.innerHTML = list.drawnList.map(name =>
    `<div class="winner-item">${escHtml(name)}</div>`
  ).join('');
}

function handleReset() {
  if (state.phase !== 'idle') return;
  const list = activeList();
  if (!list) return;
  list.drawnList = [];
  saveState();
  animEngine.clear();
  updateStats();
  updateWinnerList();
}

// ======== 持久化 ========
function saveState() {
  try {
    const data = {
      lists: state.lists,
      activeKey: state.activeKey,
      drawCount: state.settings.drawCount,
      allowRepeat: state.settings.allowRepeat
    };
    localStorage.setItem('lottery-state', JSON.stringify(data));
  } catch {}
}

function loadState() {
  try {
    const raw = localStorage.getItem('lottery-state');
    if (!raw) return;
    const data = JSON.parse(raw);

    // 兼容旧格式：{ nameList, drawnList, ... }
    if (Array.isArray(data.nameList)) {
      state.lists['名单1'] = { nameList: data.nameList, drawnList: data.drawnList || [] };
      state.activeKey = '名单1';
      if (typeof data.drawCount === 'number') state.settings.drawCount = data.drawCount;
      if (typeof data.allowRepeat === 'boolean') state.settings.allowRepeat = data.allowRepeat;
      saveState();
      return;
    }

    // 新格式
    if (data.lists && typeof data.lists === 'object') state.lists = data.lists;
    if (typeof data.activeKey === 'string') state.activeKey = data.activeKey;
    if (typeof data.drawCount === 'number') state.settings.drawCount = data.drawCount;
    if (typeof data.allowRepeat === 'boolean') state.settings.allowRepeat = data.allowRepeat;
  } catch {}
}

// ======== 刷新全部 UI ========
function refreshAll() {
  ensureActive();
  updateListSelector();
  updateStats();
  updateNameListPreview();
  updateWinnerList();

  // 更新删除按钮状态
  const btn = document.getElementById('btn-delete-list');
  btn.disabled = !state.activeKey;
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ======== 入口 ========
function init() {
  loadState();
  buildUI();
  bindEvents();
  animEngine = new AnimationEngine(document.getElementById('animation-stage'));

  document.getElementById('draw-count').value = state.settings.drawCount;
  document.getElementById('allow-repeat').checked = state.settings.allowRepeat;

  refreshAll();
  initAudio();
}

init();
