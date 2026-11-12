const api = require('../../utils/api.js');
const store = require('../../utils/listings.js');
const nav = require('../../utils/nav.js');
Page({
 data: { list: [], demo: false },
 onShow() {
   const p = api.profileOf();
   this.setData({ demo: api.apiMode(), list: api.isLoggedIn() ? store.all().filter(x => x.owner === p.phone).map(x => Object.assign({}, x, { label: { pending: '待审核', approved: '已上架', rejected: '审核未通过', offline: '已下架' }[x.status] })) : [] });
 },
 offline(e) {
   if (!api.isLoggedIn()) { api.goLogin(); return; }
   wx.showModal({ title: '确认下架商品', content: '下架后商品将从校园集市隐藏，再次发布需重新审核。', success: result => {
     if (!result.confirm) return;
     api.post('/goods/offline', { id: e.currentTarget.dataset.id }).then(() => { this.onShow(); wx.showToast({ title: '已下架', icon: 'success' }); }).catch(error => wx.showToast({ title: error.msg || '下架失败', icon: 'none' }));
   } });
 },
 edit(e) { nav.go('/pages/publish/publish?editId=' + encodeURIComponent(e.currentTarget.dataset.id)); },
 review(e) {
   if (!api.apiMode() || !api.isLoggedIn()) return;
   const item = store.all().find(x => x.id === e.currentTarget.dataset.id);
   if (!item || item.owner !== api.profileOf().phone) return;
   try { store.review(item.id, e.currentTarget.dataset.ok === 'yes'); this.onShow(); }
   catch(error) { wx.showToast({ title: error.message, icon: 'none' }); }
 }
});
