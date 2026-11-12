// 发布成功页：求购回执（在售同类件数按货架实算）
const nav = require('../../utils/nav.js');
const api = require('../../utils/api.js');
const ui = require('../../utils/ui.js');

// 微信不自动 decodeURIComponent 查询参数，这里统一解码
const dec = (v) => { try { return decodeURIComponent(v || ''); } catch (e) { return v || ''; } };

Page(ui.toneAware({
  data: {
    item: { name: '', budget: '', cond: '', n: 0 }
  },
  onLoad(opt) {
    const kw = dec(opt && opt.kw) || '';
    const cat = dec(opt && opt.cat) || '';
    // 在售同类 = 实数；预算 = 同类实际价格区间（无同类才回退按关键词档位）
    const rel = api.relatedGoods(cat);
    const nums = rel.map((g) => parseFloat(String(g.price).replace(/[^\d.]/g, '')) || 0);
    let budget = '';
    if (rel.length) {
      budget = Math.min.apply(null, nums) + '-' + Math.max.apply(null, nums) + '元';
    } else if (/教材|书|讲义|真题|高数/.test(kw)) { budget = '30-60元'; }
    else if (/耳机|音箱|相机|电脑|键盘|数码/.test(kw)) { budget = '100-200元'; }
    else { budget = '50-100元'; }
    const cond = rel.length ? rel[0].cond : '八成新以上';
    const name = kw || (cat ? cat + '类物品' : '闲置好物');
    this.setData({ item: { name, budget, cond, n: rel.length } });
  },
  goResult() { nav.switchTo('/pages/home/home'); },
  again() { nav.switchTo('/pages/wants/wants'); }
}));
