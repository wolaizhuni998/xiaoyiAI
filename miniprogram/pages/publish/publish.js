const market = require('../../utils/market.js');
// 发布页：发布闲置商品（走统一接口层，mock 返回本地 id）
const nav = require('../../utils/nav.js');
const api = require('../../utils/api.js');
const ui = require('../../utils/ui.js');

Page(ui.toneAware({
  data: {
    form: { title: '', cat: '', price: '', cond: '', place: '', desc: '', usageMonths: '', completeness: '' },
    photos: [],
    cats: ['数码', '书籍教材', '生活用品', '服饰鞋包', '运动器材'],
    conds: ['全新', '九五成新', '九成新', '八成新', '七成新'],
    places: ['宿舍区', '教学区', '实验楼', '图书馆', '体育馆'],
    submitting: false,
    aiBusy: false,
    aiInfo: null
  },
  onLoad(options) {
    if (!options || !options.editId) return;
    const item = require('../../utils/listings.js').all().find(x => x.id === options.editId && x.owner === api.profileOf().phone && ['rejected', 'offline'].includes(x.status));
    if (!item) { this.setData({ editBlocked: true }); wx.showToast({ title: '商品不可修改', icon: 'none' }); return; }
    this._editId = item.id;
    this.setData({ form: { title: item.title, cat: item.cat, price: String(item.price).replace(/[¥￥]/g, ''), cond: item.cond, place: item.place, desc: item.desc, usageMonths: item.usageMonths == null ? '' : String(item.usageMonths), completeness: item.completeness || '' }, photos: item.photos || [], editLabel: '修改商品 · 需重新AI审核', editMarket: item.school + ' · ' + item.campus });
    this._editMarket = { school: item.school, campus: item.campus };
  },
  onShow() { const m = this._editMarket || market.current(); this.setData({ marketLabel: m ? m.school + ' · ' + m.campus : '尚未选择校园，点击设置', }); },
  pickMarket() { nav.go('/pages/profile/profile'); },
  onTab(e) {
    const url = e.detail.url;
    if (url.indexOf('/pages/publish/') > -1) return;
    nav.switchTo(url);
  },
  onNegotiable(e) { this.setData({ 'form.price': e.detail.value ? '面议' : '' }); },
  onField(e) {
    this.setData({ assessment: null });
    const k = e.currentTarget.dataset.k;
    this.setData({ ['form.' + k]: e.detail.value });
  },
  onCat(e) { this.setData({ 'form.cat': this.data.cats[e.detail.value] }); },
  onCond(e) { this.setData({ 'form.cond': this.data.conds[e.detail.value] }); },
  onPlace(e) { this.setData({ 'form.place': this.data.places[e.detail.value] }); },

  // ===== 照片：选图 / 删图 / 预览 =====
  addPhoto() {
    const left = 6 - this.data.photos.length;
    if (left <= 0) return;
    wx.chooseMedia({
      count: left,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const add = (res.tempFiles || []).map((f) => f.tempFilePath).filter(Boolean);
        this.setData({ photos: this.data.photos.concat(add).slice(0, 6) });
      }
    });
  },
  removePhoto(e) {
    const list = this.data.photos.slice();
    list.splice(e.currentTarget.dataset.i, 1);
    this.setData({ photos: list });
  },
  previewPhoto(e) {
    wx.previewImage({ current: e.currentTarget.dataset.src, urls: this.data.photos });
  },

  // ===== 拍照填表：照片 + 关键词 → 类目/标题/成色/参考价一并填好，可手动改 =====
  assessmentKey() { const f = Object.assign({}, this.data.form); delete f.price; return JSON.stringify({ form: f, photos: this.data.photos }); },
  aiFill() {
    if (this.data.aiBusy) return;
    if (!this.data.photos.length) {
      wx.showToast({ title: '先选 1 张照片再识别', icon: 'none' });
      return;
    }
    this.setData({ aiBusy: true });
    const assessmentKey = this.assessmentKey();
    require('../../utils/ai.js').assess(this.data.form, this.data.photos)
      .then(r => {
        if (assessmentKey !== this.assessmentKey()) { this.setData({ aiBusy: false }); wx.showToast({ title: '商品信息已变化，请重新审核', icon: 'none' }); return; }
        this._assessmentKey = assessmentKey;
        this.setData({ assessment: r, aiBusy: false });
        wx.showModal({ title: r.decision === 'pass' ? 'AI初审：低风险' : 'AI初审：需人工复核', content: r.reasons.join('；') + '\n参考 ¥' + r.pricing.low + '–' + r.pricing.high + '：' + r.pricing.reason + '\n' + r.limitations, confirmText: '采用参考价', success: result => { if (result.confirm) this.setData({ 'form.price': String(r.pricing.price) }); } });
      }).catch(e => { this.setData({ aiBusy: false, assessment: null }); wx.showToast({ title: e.msg || 'AI分析失败', icon: 'none' }); });
  },

  submit() {
    if (this.data.editBlocked || this.data.submitting || this.data.aiBusy) return;
    if (!api.isLoggedIn()) {
      wx.showToast({ title: '发布前请先手机号登录', icon: 'none' });
      setTimeout(() => { api.goLogin(); }, 700);
      return;
    }
    const selected = this._editMarket || market.current();
    if (!selected) { this.pickMarket(); return; }
    const f = this.data.form;
    if (!f.title || !f.price) { wx.showToast({ title: '请填写物品名称与价格', icon: 'none' }); return; }
    if (f.price !== '面议' && (!Number.isFinite(Number(f.price)) || Number(f.price) <= 0)) { wx.showToast({ title: '请输入有效价格', icon: 'none' }); return; }
    if (!f.cat || !f.cond || !f.place) { wx.showToast({ title: '请补全分类、成色和地点', icon: 'none' }); return; }
    if (!f.desc.trim() || !this.data.photos.length) { wx.showToast({ title: '请填写描述并添加照片', icon: 'none' }); return; }
    if (this.data.form.usageMonths === '' || !Number.isFinite(Number(this.data.form.usageMonths)) || Number(this.data.form.usageMonths) < 0 || !this.data.form.completeness.trim()) { wx.showToast({ title: '请填写使用时长及完整度', icon: 'none' }); return; }
    if (!this.data.assessment || this._assessmentKey !== this.assessmentKey()) { wx.showToast({ title: '请先完成AI审核与定价', icon: 'none' }); return; }
    this.setData({ submitting: true });
    const item = {
      desc: (f.desc || '').trim(),
      school: selected.school, campus: selected.campus,
      id: 'u' + Date.now(),
      title: f.title,
      price: f.price === '面议' ? '面议' : ((f.price + '').indexOf('¥') > -1 ? f.price : '¥' + f.price),
      cond: f.cond || '九成新',
      place: f.place || '宿舍区',
      cat: f.cat || '',
      photos: this.data.photos.slice()
    };
    // 走统一接口层 /goods/publish：mock 返回本地 id，真实后端返回真实 id；失败也先本地演示不卡流程
    const finish = (id) => {
      if (id) item.id = id;
      // 提交后进入待审核，审核通过才进入公开集市。
      this._editId = null; this._editMarket = null; this._assessmentKey = null;
      this.setData({ submitting: false, assessment: null, aiInfo: null, editLabel: '', photos: [], form: { title: '', cat: '', price: '', cond: '', place: '', desc: '', usageMonths: '', completeness: '' } });
      wx.showToast({ title: '已提交审核', icon: 'success' });
      setTimeout(() => { nav.go('/pages/my-listings/my-listings'); }, 700);
    };
    const payload = {
      title: item.title, price: item.price, cond: item.cond, place: item.place,
      school: item.school, campus: item.campus,
      usageMonths: Number(f.usageMonths), completeness: f.completeness.trim(),
      editId: this._editId || undefined,
      aiReport: this.data.assessment,
      cat: item.cat, desc: item.desc, imgs: item.photos
    };
    const send = api.apiMode() ? require('../../utils/photos.js').persist(item.photos).then(photos => api.post('/goods/publish', Object.assign({}, payload, { imgs: photos }))) : api.post('/goods/publish', payload);
    send.then((r) => finish(r && r.id)).catch((error) => { this.setData({ submitting: false }); wx.showToast({ title: error.msg || '发布失败，请重试', icon: 'none' }); });
  },
  myListings() { nav.go('/pages/my-listings/my-listings'); },
  cancel() { nav.back(); }
}));
