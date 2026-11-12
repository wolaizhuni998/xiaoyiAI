const listings = require('./listings.js');
// 统一接口层（P3 接口预留）：mock / 真实接口一键切换
// - 默认 mock 演示（storage apiMock = '1'），后端就绪后：
//   1) 改下面 BASE_URL  2) 设置里关掉「数据模式」开关（或 setApiMode(false)）
// - 真实接口约定：POST/GET {BASE_URL}{path}，header 携带 Authorization: Bearer <token>；
//   401 = 未登录/过期 → 调用方跳登录页（pages/login/login）。
const BASE_URL = 'https://your-api.example.com'; // TODO: 队友后端就绪后替换
const MOCK_KEY = 'apiMock';   // '1' = mock（默认）, '0' = 真实接口
const TOKEN_KEY = 'apiToken';

function apiMode() {
  try {
    const v = wx.getStorageSync(MOCK_KEY);
    if (v === '' || v === undefined || v === null) return true; // 未设置=mock 开
    return v !== '0';
  } catch (e) { return true; }
}
function setApiMode(useMock) {
  try { wx.setStorageSync(MOCK_KEY, useMock ? '1' : '0'); } catch (e) {}
}
function getToken() {
  try { return wx.getStorageSync(TOKEN_KEY) || ''; } catch (e) { return ''; }
}
function setToken(t) {
  try { wx.setStorageSync(TOKEN_KEY, t || ''); } catch (e) {}
}

// ===== 统一请求（Promise）=====
function request(path, opts) {
  opts = opts || {};
  const method = opts.method || 'POST';
  const data = opts.data || {};
  if (apiMode()) return mockRequest(path, data);
  // 占位域名守卫：BASE_URL 还没换成队友真实后端时，即使开了「真实接口」也不发网，自动回落 mock（避免 ERR_CONNECTION_CLOSED 报错刷屏）
  if (BASE_URL.indexOf('your-api.example.com') > -1) {
    if (!request._warned) {
      request._warned = true;
      console.warn('[api] BASE_URL 仍为占位域名，已自动使用 mock 数据；后端就绪后替换 BASE_URL 即切真实接口');
    }
    return mockRequest(path, data);
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + path,
      method,
      data,
      header: { 'content-type': 'application/json', Authorization: 'Bearer ' + getToken() },
      success(res) {
        if (res.statusCode === 401) { setToken(''); reject({ code: 401, msg: '未登录或登录过期' }); return; }
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data);
        else reject({ code: res.statusCode, msg: (res.data && res.data.msg) || ('请求失败 ' + res.statusCode) });
      },
      fail(err) { reject({ code: -1, msg: (err && err.errMsg) || '网络异常' }); }
    });
  });
}
function get(path, data) { return request(path, { method: 'GET', data: data || {} }); }
function post(path, data) { return request(path, { method: 'POST', data: data || {} }); }

// ===== mock 服务（演示默认）=====
const MOCKS = {
  // 登录：手机号 + 验证码（mock 下任意 11 位手机号 / 任意验证码可过）
  '/auth/sms': (d) => ({ sent: true, hint: '验证码已发送（Demo：任意验证码可登录）', phone: d.phone }),
  '/auth/login': (d) => ({ token: 'mock-token-' + Date.now(), user: profileOf(d.phone) }),
  // 用户资料（头像/昵称）
  '/user/profile': () => profileOf(),
  '/user/profile/update': (d) => { const p = profileOf(); if (d.nick) p.nick = d.nick; if (d.avatar) p.avatar = d.avatar; saveProfile(p); return { ok: 1, user: p }; },
  // 首页 / 发现 / 求购列表
  '/home/list': (d) => ({ list: homeItems(d) }),
  '/find/list': (d) => ({ list: homeItems(d) }),
  '/wants/list': () => ({ list: wantItems() }),
  // 写操作（发布 / 求购 / 聊天 / 上架）
  '/wants/publish': (d) => ({ id: 'w' + Date.now(), cat: d.cat || '其他', kw: d.kw || '' }),
  '/goods/publish': (d) => { if (!isLoggedIn()) throw new Error('请先登录'); return listings.publish(d, profileOf()); },
  '/goods/offline': (d) => { if (!isLoggedIn()) throw new Error('请先登录'); listings.offline(d.id, profileOf()); return { ok: 1 }; },
  '/chat/send': (d) => ({ reply: autoReply(d.msg || '') }),
  // AI 推荐（参数含客户端 pool，服务端按同一占位策略回排）
  '/ai/recommend': (d) => {
    const pool = (d && d.pool) ? d.pool.slice() : [];
    const kw = (d && d.kw) || '';
    const hit = kw ? pool.filter((it) => (it.title + it.cond + it.place + (it.icon || '')).indexOf(kw) > -1) : [];
    const priceNum = (p) => { const m = String(p).replace(/[^\d.]/g, ''); return m ? parseFloat(m) : 0; };
    const rest = pool.filter((it) => hit.indexOf(it) < 0).sort((a, b) => priceNum(a.price) - priceNum(b.price));
    return { list: hit.concat(rest) };
  },
  // A+B：拍照识图上架（品类/标题/成色/参考价一次返回；后端就绪后换多模态识别，返回结构不变）
  '/ai/analyze': (d) => analyzePhoto(d)
};

function mockRequest(path, data) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const h = MOCKS[path];
      if (!h) { reject({ code: 404, msg: 'mock 未实现: ' + path }); return; }
      try { resolve(h(data || {})); } catch (e) { reject({ code: -1, msg: String(e) }); }
    }, 200 + Math.floor(Math.random() * 200)); // 200-400ms 模拟网络
  });
}

// ===== A+B：拍照识图（演示规则档；接口就绪后同结构换多模态识别，页面无需改）=====
const SCAN_RULES = [
  { re: /教材|讲义|课本|习题|真题|考研|高数|英语|书/, cat: '书籍教材', icon: '书', demo: '高等数学教材 · 第七版', cond: '九成新', low: 15, high: 55 },
  { re: /键盘|鼠标|耳机|音箱|充电|转接|相机|电脑|平板|路由|数码/, cat: '数码', icon: '电', demo: 'Type-C 快充充电宝 · 20000mAh', cond: '八成新', low: 35, high: 160 },
  { re: /鞋|衣|帽|包|伞|外套|帆布/, cat: '服饰鞋包', icon: '衣', demo: '帆布鞋 · 百搭款', cond: '九成新', low: 25, high: 90 },
  { re: /球|瑜伽|跳绳|健身|垫|拍|跑/, cat: '运动器材', icon: '器', demo: '瑜伽垫 · 加厚防滑', cond: '八成新', low: 15, high: 70 },
  { re: /灯|杯|收纳|风扇|冰箱|台灯|生活/, cat: '生活用品', icon: '用', demo: '护眼台灯 · 可调光', cond: '九成新', low: 15, high: 80 }
];
function analyzePhoto(d) {
  const kw = ((d && d.kw) || '').trim();
  let r = SCAN_RULES[SCAN_RULES.length - 1];
  for (let i = 0; i < SCAN_RULES.length; i++) {
    if (SCAN_RULES[i].re.test(kw)) { r = SCAN_RULES[i]; break; }
  }
  const price = Math.round(((r.low + r.high) / 2) / 5) * 5;
  return {
    cat: r.cat, icon: r.icon, title: kw || r.demo, cond: r.cond,
    price, low: r.low, high: r.high,
    source: '识图 Demo 结果（mock 档位，接口就绪后换多模态识别、结构不变）'
  };
}

// ===== D：匹配度真算（求购 vs 在售货架，逐项命中给分；求购页与成功页复用同一算法）=====
function budgetRange(s) {
  const m = String(s || '').match(/(\d+)\s*-\s*(\d+)/);
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : [0, 0];
}
function numOf(p) { const m = String(p).replace(/[^\d.]/g, ''); return m ? parseFloat(m) : 0; }
function scoreMatch(w) {
  const cat = (w && w.cat) || '';
  const rel = HOME_POOL.filter((g) => cat && g.cat === cat);
  const rg = budgetRange(w && w.budget);
  const inB = rg[0] && rg[1] ? rel.filter((g) => numOf(g.price) >= rg[0] && numOf(g.price) <= rg[1]) : [];
  const same = (w && w.place) ? rel.filter((g) => g.place === w.place) : [];
  let deg = rel.length ? 35 + 5 * Math.min(rel.length, 3) : 20;
  if (inB.length) deg += Math.min(30, inB.length * 15);
  if (same.length) deg += 15;
  if (inB.length && same.length) deg += 10;
  deg = Math.min(99, deg);
  const why = rel.length
    ? ('货架同类 ' + rel.length + ' 件 · 预算内 ' + inB.length + ' 件 · 同区 ' + same.length + ' 件')
    : '货架暂无同类，已在求购雷达排队';
  return { deg, tag: deg >= 85 ? '高匹配' : '匹配中', why };
}
function relatedGoods(cat) {
  const c = cat || '';
  return HOME_POOL.filter((g) => c && g.cat === c);
}

// ===== mock 数据（与页面演示数据同风格，全虚构）=====
const HOME_POOL = [
  { id: 1, icon: '书', title: '高等数学教材 · 上册', price: '¥45', cond: '九成新', place: '宿舍区', cat: '书籍教材' },
  { id: 2, icon: '器', title: '机械键盘 87 键', price: '¥120', cond: '八成新', place: '实验楼', cat: '数码' },
  { id: 3, icon: '灯', title: '护眼台灯 · 可调光', price: '¥30', cond: '九成新', place: '宿舍区', cat: '生活用品' },
  { id: 4, icon: '乐', title: '民谣吉他 41 寸', price: '¥260', cond: '八成新', place: '艺术楼', cat: '运动器材' },
  { id: 5, icon: '卷', title: '考研英语真题合集', price: '¥25', cond: '九五成新', place: '图书馆', cat: '书籍教材' },
  { id: 6, icon: '键', title: '无线鼠标 + 鼠标垫', price: '¥35', cond: '八成新', place: '宿舍区', cat: '数码' }
];
function homeItems(d) {
  if (!d || !d.kw) return HOME_POOL.slice();
  const kw = d.kw;
  return HOME_POOL.filter((it) => (it.title + it.cond + it.place + it.icon).indexOf(kw) > -1);
}
function wantItems() {
  return [
    { id: 'w1', cat: '教材', kw: '高数习题册 · 第二版' },
    { id: 'w2', cat: '数码', kw: '求购 Type-C 转 HDMI 转接头' },
    { id: 'w3', cat: '生活', kw: '宿舍小冰箱一台，可自提' },
    { id: 'w4', cat: '运动', kw: '羽毛球拍 4U，接受小刀' }
  ];
}
function autoReply(msg) {
  const m = String(msg);
  if (m.indexOf('价') > -1 || m.indexOf('多少') > -1) return '这件是同学自用的，价格已经很实在啦，可小刀～';
  if (m.indexOf('在哪') > -1 || m.indexOf('位置') > -1 || m.indexOf('面交') > -1) return '约在砚湖大学南门驿站面交吧，下课都方便。';
  if (m.indexOf('在吗') > -1 || m.indexOf('你好') > -1) return '在的！东西还在，随时可以约时间～';
  return '收到～（Demo 自动回复，后端接入后由真实接口返回）';
}

// mock 用户资料（持久化在 storage，供我的页展示/编辑）
const PROFILE_KEY = 'apiProfile';
function profileOf(phone) {
  let p = {};
  try { p = wx.getStorageSync(PROFILE_KEY) || {}; } catch (e) {}
  if (!p.nick) p.nick = '同窗甲';
  if (!p.avatar) p.avatar = '';
  if (phone && !p.phone) p.phone = phone;
  return p;
}
function saveProfile(p) {
  try { wx.setStorageSync(PROFILE_KEY, p); } catch (e) {}
}

// 登录态：token 非空即已登录（发布/求购前用它拦截）
function isLoggedIn() { return !!getToken(); }

// 兜底跳登录页（无栈时 reLaunch）
function goLogin() {
  wx.navigateTo({
    url: '/pages/login/login',
    fail: () => { wx.reLaunch({ url: '/pages/login/login' }); }
  });
}

module.exports = { BASE_URL, request, get, post, apiMode, setApiMode, getToken, setToken, isLoggedIn, goLogin, profileOf, saveProfile, scoreMatch, relatedGoods };
