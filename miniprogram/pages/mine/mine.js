// 我的页：资料行 + 功能入口（除设置外均为演示入口）
const nav = require('../../utils/nav.js');
const api = require('../../utils/api.js');
const ui = require('../../utils/ui.js');

Page(ui.toneAware({
  data: {
    nick: '',
    avatar: '',
    phone: '',
    nickCh: '校',
    menus: [
      { id: 'm1', ch: '我发布的', note: '' },
      { id: 'm2', ch: '我的求购', note: '' },
      { id: 'm3', ch: '收藏夹', note: '' },
      { id: 'm4', ch: '交易记录', note: '' },
      { id: 'm6', ch: '设置', note: '数据模式 · 主题色' }
    ]
  },
  onLoad() { },
  onShow() {
    const p = api.profileOf();
    // WXML 表达式不做字符串下标取值，头像占位字在 JS 里取首字
    const nickCh = (p.nick || '校').charAt(0) || '校';
    this.setData({ nick: p.nick || '', avatar: p.avatar || '', phone: p.phone || '', nickCh });
  },
  onTab(e) {
    const url = e.detail.url;
    if (url.indexOf('/pages/mine/') > -1) return;
    nav.switchTo(url);
  },
  editProfile() { nav.go('/pages/profile/profile'); },
  open(e) {
    const id = e.currentTarget.dataset.id;
    if (id === 'm1') { nav.go('/pages/my-listings/my-listings'); return; }
    if (id === 'm3') { if (!api.isLoggedIn()) { api.goLogin(); return; } nav.go('/pages/favorites/favorites'); return; }
    if (id === 'm6') { nav.go('/pages/settings/settings'); return; }
    wx.showToast({ title: '演示入口（' + e.currentTarget.dataset.ch + '）', icon: 'none' });
  }
}));
