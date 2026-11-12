const market = require('../../utils/market.js');
// 首页：定位/搜索/分类/排序/单列列表
const nav = require('../../utils/nav.js');
const ui = require('../../utils/ui.js');

const catalog = require('../../utils/catalog.js');
// ===== 成色 / 地点 排序权重 =====
const COND_RANK = { '九五成新': 4, '九成新': 3, '八成新': 2, '七成新': 1 };
const PLACE_RANK = { '宿舍区': 1, '图书馆': 2, '实验楼': 3, '艺术楼': 4, '体育场': 5 };
const priceNum = (p) => { const m = String(p).replace(/[^\d.]/g, ''); return m ? parseFloat(m) : 0; };

Page(ui.toneAware({
  data: {
    loc: '砚湖大学',
    locating: false,
    minPrice: '', maxPrice: '', condition: '',
    conditions: ['全部成色', '全新', '九五成新', '九成新', '八成新', '七成新'],
    kw: '',
    searched: false,
    tag: '综合',
    tags: ['综合', '价格', '成色', '地点'],
    cat: '',
    subTab: '热门推荐',
    cats: [
      { ch: '数', label: '数码' }, { ch: '书', label: '书籍教材' },
      { ch: '用', label: '生活用品' }, { ch: '衣', label: '服饰鞋包' },
      { ch: '动', label: '运动器材' }
    ],
    list: []
  },
  onLoad() {
    // 页面内已有大标题，原生导航栏标题留空，避免两行标题打架
    this._apply(''); // 合并用户新发布条目，首屏即可展示（照片功能）
  },
  onShow() { this._apply((this.data.kw || '').trim()); },
  onTab(e) {
    const url = e.detail.url;
    if (url.indexOf('/pages/home/') > -1) return;
    nav.switchTo(url);
  },

  // ===== 任务②：学校名可点击 → 微信定位接口 =====
  // 预留接口：getLocation 成功后应再经逆地理编码解析校名；解析依赖地图服务
  //（开发成本），故当前拿到坐标仍沿用默认校区名，仅打通定位调用链路。
  pickLoc() { nav.go('/pages/profile/profile'); },
  _resolveCampus(res) {
    // 预留：坐标 → 校园名称（需后端 / 地图 Key，暂返回空走默认校区）
    void res;
    return '';
  },

  // ===== 任务③：搜索按钮点击 / 回车 → 关键词筛选商品列表 =====
  onPrice(e) { this.setData({ [e.currentTarget.dataset.k]: e.detail.value }); this._apply(this.data.kw.trim()); },
  onCondition(e) { const value = this.data.conditions[Number(e.detail.value)]; this.setData({ condition: value === '全部成色' ? '' : value }); this._apply(this.data.kw.trim()); },
  onKw(e) { this.setData({ kw: e.detail.value }); },
  doSearch() {
    const kw = (this.data.kw || '').trim();
    this._apply(kw);
    wx.showToast({
      title: kw ? ('找到 ' + this.data.list.length + ' 件「' + kw + '」相关') : '已显示全部商品',
      icon: 'none'
    });
  },
  clearSearch() {
    if (!this.data.searched) return;
    this.setData({ kw: '' });
    this._apply('');
  },

  // ===== 任务①：筛选标签 → 实际变更商品列表 =====
  pickTag(e) {
    const t = e.currentTarget.dataset.t;
    this.setData({ tag: t });
    this._apply((this.data.kw || '').trim());
  },

  // 统一列表计算：基准数据(双Tab) → 关键词过滤 → 标签排序
  _apply(kw) {
    const selected = market.current();
    this.setData({ loc: selected ? selected.school : '选择你的校园', campus: selected ? selected.campus : '设置学校和校区后进入专属集市' });
    let list = catalog.search(catalog.list(this.data.subTab), kw);
    if (this.data.cat) list = list.filter((it) => it.cat === this.data.cat);
    if (this.data.condition) list = list.filter(it => it.cond === this.data.condition);
    if (this.data.minPrice !== '') list = list.filter(it => it.price !== '面议' && priceNum(it.price) >= Number(this.data.minPrice));
    if (this.data.maxPrice !== '') list = list.filter(it => it.price !== '面议' && priceNum(it.price) <= Number(this.data.maxPrice));
    const tag = this.data.tag;
    if (tag === '价格') list.sort((a, b) => (a.price === '面议' ? Infinity : priceNum(a.price)) - (b.price === '面议' ? Infinity : priceNum(b.price)));
    else if (tag === '成色') list.sort((a, b) => (COND_RANK[b.cond] || 0) - (COND_RANK[a.cond] || 0));
    else if (tag === '地点') list.sort((a, b) => (PLACE_RANK[a.place] || 0) - (PLACE_RANK[b.place] || 0));
    // 综合：保持基准顺序（关键词命中优先已在过滤中体现）
    // WXML 表达式不支持函数调用，价格展示串在此预计算（¥ 由模板单独渲染）
    list = list.map((it) => Object.assign({}, it, {
      k: ui.catKey(it.cat),
      priceText: String(it.price == null ? '' : it.price).replace(/[¥￥\s]/g, '')
    }));
    this.setData({ list, searched: !!kw });
  },

  pickCat(e) {
    const l = e.currentTarget.dataset.l;
    const cat = this.data.cat === l ? '' : l; // 再点一次取消筛选
    this.setData({ cat });
    this._apply((this.data.kw || '').trim());
    wx.showToast({ title: cat ? '已筛选 · ' + cat : '已显示全部', icon: 'none' });
  },
  pickSub(e) {
    const t = e.currentTarget.dataset.t;
    if (t === this.data.subTab) return;
    this.setData({ subTab: t });
    this._apply((this.data.kw || '').trim());
  },
  openItem(e) {
    const d = e.currentTarget.dataset.d;
    nav.go('/pages/detail/detail?id=' + encodeURIComponent(d.id));
  }
}));
