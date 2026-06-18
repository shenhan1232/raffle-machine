export function parseNames(content, fileType) {
  if (fileType !== 'csv') {
    return content.split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);
  }

  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return [];

  // 将所有行拆分为列
  const rows = lines.map(line => line.split(/[,，\t]/).map(c => c.trim()));

  // 找名字所在列的索引
  const nameColIndex = detectNameColumn(rows);

  // 按该列提取名字
  const headerKeywords = /^(姓名|名字|名称|name|人员|员工|选手|昵称|用户名|候选人|参与者|联系人)$/i;
  const names = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const val = row[nameColIndex];
    if (!val) continue;

    // 跳过表头行
    if (i === 0 && headerKeywords.test(val)) continue;

    // 跳过明显不是人名的值（纯数字、太长、太短的单字母等）
    if (/^\d+$/.test(val)) continue;
    if (val.length === 1 && !/[一-鿿]/.test(val)) continue;
    if (val.length > 30) continue;

    names.push(val);
  }

  return [...new Set(names)];
}

function detectNameColumn(rows) {
  if (rows.length === 0) return 0;

  const firstRow = rows[0];
  const nameKeywords = /^(姓名|名字|名称|name|人员|员工|选手|昵称|用户名|候选人|参与者|联系人)$/i;

  // 1. 先检查第一行是否有匹配的表头
  for (let i = 0; i < firstRow.length; i++) {
    if (nameKeywords.test(firstRow[i])) {
      return i;
    }
  }

  // 2. 没有表头时，对每列打分，选最像"名字列"的那一列
  const sampleRows = rows.slice(0, Math.min(20, rows.length));
  const colCount = Math.max(...sampleRows.map(r => r.length));

  let bestCol = 0;
  let bestScore = -1;

  for (let col = 0; col < colCount; col++) {
    const values = sampleRows.map(r => r[col] || '').filter(v => v);
    if (values.length === 0) continue;

    const score = scoreNameColumn(values);
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }

  return bestCol;
}

function scoreNameColumn(values) {
  let score = 0;
  for (const v of values) {
    // 含中文字符加分
    if (/[一-鿿]/.test(v)) score += 3;
    // 纯中文 2-4 字加分最多（典型中文名）
    if (/^[一-鿿]{2,4}$/.test(v)) score += 5;
    // 含字母和空格可能是英文名
    if (/^[a-zA-Z\s.-]{2,20}$/.test(v)) score += 2;
    // 纯数字扣分
    if (/^\d+$/.test(v)) score -= 5;
    // 太长扣分（不太可能是名字）
    if (v.length > 10) score -= 2;
    // 明显是日期格式扣分
    if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/.test(v)) score -= 5;
  }
  return score / values.length;
}
