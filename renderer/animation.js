import { playClickSound } from './audio.js';

export class AnimationEngine {
  constructor(container) {
    this.container = container;
  }

  clear() {
    this.container.innerHTML = '';
  }

  createCharBoxes(name) {
    const row = document.createElement('div');
    row.className = 'name-row';
    row.style.opacity = '0';
    row.style.transform = 'translateY(12px)';
    row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    const boxes = [];
    for (const char of name) {
      const box = document.createElement('div');
      box.className = 'char-box';
      box.dataset.target = char;
      box.innerHTML = '<span class="corner-tl"></span><span class="corner-tr"></span><span class="corner-bl"></span><span class="corner-br"></span>';
      row.appendChild(box);
      boxes.push(box);
    }

    this.container.appendChild(row);
    return { row, boxes };
  }

  async revealName(name) {
    // 清理旧的名字行
    const rows = this.container.querySelectorAll('.name-row');
    if (rows.length > 1) {
      rows[0].remove();
    }

    const { row, boxes } = this.createCharBoxes(name);

    // 名字容器滑入
    requestAnimationFrame(() => {
      row.style.opacity = '1';
      row.style.transform = 'translateY(0)';
    });
    await sleep(350);

    // 逐字揭晓
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      const targetChar = box.dataset.target;
      await this.revealChar(box, targetChar);
      if (i < boxes.length - 1) {
        await sleep(randomBetween(300, 500));
      }
    }
  }

  async revealChar(box, targetChar) {
    // 阶段1: 搜索 (0.3s) — 放大镜划圈
    box.classList.add('searching');
    box.innerHTML = '<div class="magnifier-wrapper"></div><span class="corner-tl"></span><span class="corner-tr"></span><span class="corner-bl"></span><span class="corner-br"></span>';
    await sleep(300);

    // 阶段2: 定格 — 闪亮 + 放大 + 音效
    box.classList.remove('searching');
    box.classList.add('flash');
    box.innerHTML = targetChar + '<span class="corner-tl"></span><span class="corner-tr"></span><span class="corner-bl"></span><span class="corner-br"></span>';
    playClickSound();

    await sleep(120);

    // 弹回常态
    box.classList.remove('flash');
    box.classList.add('revealed');
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
