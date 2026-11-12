// 商品详情：从首页进入；联系卖家 → 进入聊天
const nav = require('../../utils/nav.js');
const ui = require('../../utils/ui.js');

// 微信不自动 decodeURIComponent 查询参数，这里统一解码（防 %E6%... 乱码）
const dec = (v) => { try { return decodeURIComponent(v || ''); } catch (e) { return v || ''; } };

Page(ui.toneAware({
  data: {
    item: { title: '校园好物', price: '¥0', cond: '九成新', place: '宿舍区', cat: '' },
    photos: [],
    k: 'other',
    priceText: '¥0',
    sellerCh: '同',
    faved: false,
    desc: '闲置物品，功能完好，诚心出售。可在校内当面交易，欢迎留言。'
  },
  onLoad(opt) { this._id = dec(opt && opt.id); this.loadItem(); },
  onShow() { if (this._id) this.loadItem(); },
  loadItem() {
    const item = require('../../utils/catalog.js').detail(this._id);
    if (!item) { this.setData({ unavailable: true, photos: [], desc: '' }); return; }
    this.setData({ unavailable: false, faved: require('../../utils/favorites.js').has(item.id), item, photos: item.photos || [], desc: item.desc || '卖家尚未提供详细描述', sellerCh: (item.sellerName || '同学').slice(0, 1), k: ui.catKey(item.cat), priceText: item.price === '面议' ? '面议' : '¥' + String(item.price).replace(/[¥￥\s]/g, '') });
  },
  previewPhoto(e) { wx.previewImage({ current: e.currentTarget.dataset.src, urls: this.data.photos }); },
  contact() {
    if (this.data.unavailable) return;
    const api = require('../../utils/api.js');
    if (!api.isLoggedIn()) { api.goLogin(); return; }
    if (this.data.item.owner === api.profileOf().phone) { wx.showToast({ title: '这是你发布的商品', icon: 'none' }); return; }
    nav.go('/pages/chat/chat?goodsId=' + encodeURIComponent(this.data.item.id));
  },
  fav() {
    if (this.data.unavailable) return;
    const api = require('../../utils/api.js');
    if (!api.isLoggedIn()) { api.goLogin(); return; }
    const faved = require('../../utils/favorites.js').toggle(this.data.item);
    this.setData({ faved });
    wx.showToast({ title: faved ? '已收藏' : '已取消收藏', icon: 'none' });
  }
}));
