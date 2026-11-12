// 聊天页：同窗对话（走 api 层 /chat/send，mock 为规则回复）
const api = require('../../utils/api.js');
const ui = require('../../utils/ui.js');

// 微信不自动 decodeURIComponent 查询参数，这里统一解码
const dec = (v) => { try { return decodeURIComponent(v || ''); } catch (e) { return v || ''; } };

Page(ui.toneAware({
  data: {
    from: '同窗卖家',
    kw: '',
    msgs: []
  },
  onLoad(opt) {
    if (opt && opt.goodsId) {
      const item = require('../../utils/catalog.js').detail(dec(opt.goodsId));
      if (!item) { this.setData({ blocked: true }); wx.showToast({ title: '商品已不可用', icon: 'none' }); return; }
      this._goodsId = item.id;
      this._seller = item.owner || 'demo-seller';
      this.setData({ from: item.sellerName || '本校同学', goods: item, msgs: [] });
      return;
    }
    const from = dec(opt && opt.from) || '同窗卖家';
    const seed = [
      { me: false, t: '你好，看到你发布的需求，我这里正好有' },
      { me: true, t: '好的，方便发个实物图吗？' },
      { me: false, t: '没问题，晚点发你。' }
    ];
    this.setData({ from, msgs: seed });
  },
  onKw(e) { this.setData({ kw: e.detail.value }); },
  send() {
    const kw = (this.data.kw || '').trim();
    if (!kw || this._sending || this.data.blocked) return;
    if (!api.isLoggedIn()) { api.goLogin(); return; }
    if (this._goodsId && !require('../../utils/catalog.js').detail(this._goodsId)) { wx.showToast({ title: '商品已不可用', icon: 'none' }); return; }
    this._sending = true;
    this.setData({ msgs: this.data.msgs.concat([{ me: true, t: kw }]), kw: '' });
    // 统一走接口层：mock 为规则回复（问价/问位置/打招呼各有答），后端就绪后同路径换真实会话
    api.post('/chat/send', { to: this._seller || this.data.from, goodsId: this._goodsId || '', msg: kw })
      .then((r) => {
        const reply = (r && r.reply) || '收到';
        this.setData({ msgs: this.data.msgs.concat([{ me: false, t: reply }]) });
      })
      .catch(() => {
        this.setData({ msgs: this.data.msgs.concat([{ me: false, t: '消息没发出去，稍后再试试' }]) });
      })
      .then(() => { this._sending = false; });
  }
}));
