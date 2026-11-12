// 界面偏好：主题色（设置页调色盘）
// - 全站只有一个强调色，写在 CSS 变量 --tone 上；页面根节点挂 tone-{{tone}} 即生效
// - 只存一个 id（如 'blue'），对应 app.wxss 里的 .tone-blue { --tone: ... }
const TONE_KEY = 'uiTone';
const DEFAULT_TONE = 'blue';

const TONES = [
  { id: 'graphite', label: '石墨', color: '#1d1d1f' },
  { id: 'blue', label: '蓝', color: '#007aff' },
  { id: 'teal', label: '青', color: '#30b0c7' },
  { id: 'green', label: '绿', color: '#34c759' },
  { id: 'yellow', label: '黄', color: '#ffcc00' },
  { id: 'orange', label: '橙', color: '#ff9500' },
  { id: 'red', label: '红', color: '#ff3b30' },
  { id: 'pink', label: '粉', color: '#ff2d55' },
  { id: 'purple', label: '紫', color: '#af52de' },
  { id: 'indigo', label: '靛', color: '#5856d6' }
];

function isValid(id) {
  for (let i = 0; i < TONES.length; i++) {
    if (TONES[i].id === id) return true;
  }
  return false;
}

function toneOf() {
  try {
    const v = wx.getStorageSync(TONE_KEY);
    return isValid(v) ? v : DEFAULT_TONE;
  } catch (e) {
    return DEFAULT_TONE;
  }
}

function setTone(id) {
  if (!isValid(id)) return;
  try { wx.setStorageSync(TONE_KEY, id); } catch (e) {}
}

// 给页面注入 tone：Page(ui.toneAware({ ... }))
// 不改变原页面的 onShow，只在其前后补一次主题色同步（切页回来立刻生效）
function toneAware(opts) {
  const o = opts || {};
  const origOnShow = o.onShow;
  o.data = Object.assign({ tone: toneOf() }, o.data || {});
  o.onShow = function () {
    const t = toneOf();
    if (this.data.tone !== t) this.setData({ tone: t });
    if (origOnShow) origOnShow.apply(this, arguments);
  };
  return o;
}

// 类目 → 图标类名（WXML 不能做函数调用，映射在 JS 里算好）
// 图标本体在 app.wxss 的 .ic-* 里，首页 / 详情 / 发布共用
const CAT_KEY = {
  '数码': 'digital',
  '书籍教材': 'book',
  '生活用品': 'life',
  '服饰鞋包': 'cloth',
  '运动器材': 'sport'
};
function catKey(cat) {
  return CAT_KEY[cat] || 'other';
}

module.exports = { TONES, DEFAULT_TONE, toneOf, setTone, toneAware, CAT_KEY, catKey };
