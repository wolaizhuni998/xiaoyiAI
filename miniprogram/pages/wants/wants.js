// 求物品：发布/编辑求购需求（点卡片载入上方编辑）
const nav = require('../../utils/nav.js');
const api = require('../../utils/api.js');
const ui = require('../../utils/ui.js');

Page(ui.toneAware({
  data: {
    kw: '',
    editing: 0,
    cats: ['数码', '书籍教材', '生活用品', '服饰鞋包', '运动器材'],
    selCat: '书籍教材',
    list: [
      { id: 1, cat: '书籍教材', title: '求购高数教材，九成新以上', budget: '30-60元', cond: '九成新以上', place: '教学区', time: '2小时前' },
      { id: 2, cat: '数码', title: '求购蓝牙耳机，功能正常即可', budget: '100-200元', cond: '功能正常', place: '宿舍区', time: '刚刚' },
      { id: 3, cat: '生活用品', title: '求购台灯，暖光可调即可', budget: '20-50元', cond: '八成新以上', place: '宿舍区', time: '昨天' },
      { id: 4, cat: '书籍教材', title: '求购考研数学讲义，带笔记', budget: '40-80元', cond: '九成新', place: '图书馆', time: '3天前' },
      { id: 5, cat: '数码', title: '求购蓝牙音箱，宿舍听歌用', budget: '50-100元', cond: '功能正常', place: '宿舍区', time: '5小时前' },
      { id: 6, cat: '服饰鞋包', title: '求购帆布鞋 41 码，九成新', budget: '40-70元', cond: '九成新', place: '宿舍区', time: '今天' },
      { id: 7, cat: '运动器材', title: '求购瑜伽垫，防滑即可', budget: '20-40元', cond: '八成新以上', place: '教学区', time: '2天前' },
      { id: 8, cat: '书籍教材', title: '求购电路分析教材，带答案', budget: '30-55元', cond: '九五成新', place: '图书馆', time: '刚刚' }
    ]
  },
  onLoad() {
    },
  onTab(e) {
    const url = e.detail.url;
    if (url.indexOf('/pages/wants/') > -1) return;
    nav.switchTo(url);
  },
  onKw(e) { this.setData({ kw: e.detail.value }); },
  pickCat(e) { this.setData({ selCat: e.currentTarget.dataset.c }); },

  publish() {
    const kw = (this.data.kw || '').trim();
    // 编辑模式：就地保存修改
    if (this.data.editing) {
      if (!kw) {
        wx.showToast({ title: '内容不能为空', icon: 'none' });
        return;
      }
      const list = this.data.list.map((w) => {
        if (w.id !== this.data.editing) return w;
        return Object.assign({}, w, { title: kw, cat: this.data.selCat, time: '刚刚' });
      });
      this.setData({ list: list, editing: 0, kw: '' });
      wx.showToast({ title: '已保存', icon: 'success' });
      return;
    }
    if (!api.isLoggedIn()) {
      wx.showToast({ title: '求购前请先手机号登录', icon: 'none' });
      setTimeout(() => { api.goLogin(); }, 700);
      return;
    }
    if (!kw) {
      wx.showToast({ title: '先写点想求购的吧', icon: 'none' });
      return;
    }
    const url = '/pages/wants-ok/wants-ok?cat=' + encodeURIComponent(this.data.selCat) + '&kw=' + encodeURIComponent(kw);
    // 走统一接口层 /wants/publish（mock 返回本地 id；真实后端同路径/同入参），失败不阻断演示
    api.post('/wants/publish', { cat: this.data.selCat, kw: kw })
      .catch(() => {})
      .then(() => { nav.go(url); });
  },

  // 点卡片 → 载入上方发布面板进入编辑
  editCard(e) {
    const d = e.currentTarget.dataset.d;
    this.setData({ editing: d.id, kw: d.title, selCat: d.cat });
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
    wx.showToast({ title: '已载入上方，改完点保存', icon: 'none' });
  },
  cancelEdit() {
    this.setData({ editing: 0, kw: '' });
  }
}));
