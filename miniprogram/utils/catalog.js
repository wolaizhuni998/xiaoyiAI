const market = require('./market.js');
const store = require('./listings.js');
const ITEMS = {
  hot: [
    { id: 1, icon: '书', title: '高等数学教材 · 上册', price: '¥45', cond: '九成新', place: '宿舍区', cat: '书籍教材' },
    { id: 2, icon: '器', title: '机械键盘 87 键', price: '¥120', cond: '八成新', place: '实验楼', cat: '数码' },
    { id: 3, icon: '灯', title: '护眼台灯 · 可调光', price: '¥30', cond: '九成新', place: '宿舍区', cat: '生活用品' },
    { id: 4, icon: '乐', title: '民谣吉他 41 寸', price: '¥260', cond: '八成新', place: '艺术楼', cat: '生活用品' },
    { id: 5, icon: '卷', title: '考研英语真题合集', price: '¥25', cond: '九五成新', place: '图书馆', cat: '书籍教材' },
    { id: 6, icon: '键', title: '无线鼠标 + 鼠标垫', price: '¥35', cond: '八成新', place: '宿舍区', cat: '数码' },
    { id: 7, icon: '衣', title: '运动卫衣 · L 码', price: '¥55', cond: '九五成新', place: '宿舍区', cat: '服饰鞋包' },
    { id: 8, icon: '鞋', title: '帆布鞋 · 42 码', price: '¥60', cond: '八成新', place: '宿舍区', cat: '服饰鞋包' },
    { id: 9, icon: '动', title: '碳素羽毛球拍 ×2', price: '¥80', cond: '九成新', place: '体育场', cat: '运动器材' },
    { id: 10, icon: '书', title: '电路分析基础 · 第四版', price: '¥38', cond: '九五成新', place: '图书馆', cat: '书籍教材' },
    { id: 11, icon: '器', title: '蓝牙音箱 · 便携款', price: '¥75', cond: '八成新', place: '宿舍区', cat: '数码' },
    { id: 12, icon: '动', title: '瑜伽垫 · 加厚防滑', price: '¥28', cond: '全新', place: '宿舍区', cat: '运动器材' }
  ]
};
ITEMS.new = [ITEMS.hot[4], ITEMS.hot[0], ITEMS.hot[3], ITEMS.hot[2], ITEMS.hot[5], ITEMS.hot[1], ITEMS.hot[11], ITEMS.hot[8], ITEMS.hot[7], ITEMS.hot[10], ITEMS.hot[6], ITEMS.hot[9]];


function list(tab) {
 const selected = market.current();
 const demos = (tab === '最新发布' ? ITEMS.new : ITEMS.hot).map(it => Object.assign({}, it, { school: market.schools[0].name, campus: '主校区', status: 'approved', demo: true, sellerName: '演示同学', desc: '演示商品，仅用于界面体验，暂无真实卖家描述。' }));
 return store.all().filter(it => it.status === 'approved').concat(demos).filter(it => market.matches(it, selected));
}
function detail(id) { return list().find(it => String(it.id) === String(id)) || null; }
function search(items, kw) { const q = String(kw || '').trim().toLowerCase(); return q ? items.filter(it => [it.title,it.desc,it.cat,it.cond,it.place].join(' ').toLowerCase().includes(q)) : items; }
module.exports = { list, detail, search };
