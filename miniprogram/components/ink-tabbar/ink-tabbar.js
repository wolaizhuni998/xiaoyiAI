const ui = require('../../utils/ui.js');

// 长按多久进入液态
const HOLD_MS = 260;
// 手指移动超过这个距离（px）判定为"想滚页面"，取消长按
const MOVE_TOL = 8;

Component({
  properties: {
    current: {
      type: String,
      value: '',
      observer(newVal) {
        this._calcActive(newVal);
      }
    },
    active: {
      type: String,
      value: '',
      observer(newVal) {
        if (newVal) this._applyKey(newVal);
      }
    }
  },
  data: {
    curKey: 'home',
    tone: 'blue',
    // 水珠中心 x（px，相对导航条左端）
    bx: 0,
    // 形变：横向拉伸 / 纵向压扁，松手回到 1
    sx: 1,
    sy: 1,
    // 拖动时水珠正压着哪一格（让那格的图标被顶起来）
    hoverIdx: -1,
    liquid: false,
    snap: true,
    blobOn: true,
    items: [
      { key: 'home', label: '首页', url: '/pages/home/home' },
      { key: 'wants', label: '求物品', url: '/pages/wants/wants' },
      { key: 'publish', label: '发布', url: '/pages/publish/publish' },
      { key: 'msg', label: '消息', url: '/pages/msg/msg' },
      { key: 'mine', label: '我的', url: '/pages/mine/mine' }
    ]
  },
  attached() {
    // 主题色变化只在页面显示时同步一次，切页回来即为最新
    this.setData({ tone: ui.toneOf() });
    if (this.properties.current) {
      this._calcActive(this.properties.current);
    } else if (this.properties.active) {
      this._applyKey(this.properties.active);
    }
  },
  ready() {
    this._measure();
  },
  pageLifetimes: {
    show() {
      const t = ui.toneOf();
      if (this.data.tone !== t) this.setData({ tone: t });
      // 页面显示时条宽可能是新的（分屏、横竖屏切换）
      this._measure();
    }
  },
  methods: {
    // ---------- 位置计算 ----------
    _measure() {
      this.createSelectorQuery()
        .select('.tabs')
        .boundingClientRect((rect) => {
          if (!rect || !rect.width) return;
          this._rect = rect;
          const i = this._indexOf(this.data.curKey);
          if (i >= 0) this.setData({ bx: this._center(i) });
        })
        .exec();
    },
    _indexOf(key) {
      for (let i = 0; i < this.data.items.length; i++) {
        if (this.data.items[i].key === key) return i;
      }
      return -1;
    },
    _center(i) {
      const n = this.data.items.length;
      const w = (this._rect && this._rect.width) || 0;
      return (w * (i + 0.5)) / n;
    },
    // 水珠中心最近落在第几格
    _nearest(x) {
      const n = this.data.items.length;
      const w = (this._rect && this._rect.width) || 0;
      if (!w) return 0;
      const i = Math.round(x / (w / n) - 0.5);
      return Math.max(0, Math.min(n - 1, i));
    },
    // 把水珠放到某个 key 对应的格子，并同步选中态
    _applyKey(key, extra) {
      const i = this._indexOf(key);
      const patch = { curKey: key, blobOn: key !== 'publish' || this._liquid };
      if (i >= 0) patch.bx = this._center(i);
      this.setData(Object.assign(patch, extra || {}));
    },
    _calcActive(url) {
      if (!url) return;
      for (let i = 0; i < this.data.items.length; i++) {
        const item = this.data.items[i];
        if (url.indexOf(item.key) !== -1) {
          this._applyKey(item.key);
          return;
        }
      }
    },

    // ---------- 手势 ----------
    onStart(e) {
      const t = e.touches[0];
      this._startX = t.clientX;
      this._startY = t.clientY;
      this._lastX = t.clientX;
      this._lastT = Date.now();
      this._suppressUntil = 0;
      clearTimeout(this._holdTimer);
      // 没量到宽度就退化成普通点击，不做液体
      if (!this._rect) return;
      this._holdTimer = setTimeout(() => this._enterLiquid(), HOLD_MS);
    },

    _enterLiquid() {
      this._liquid = true;
      this.setData({
        liquid: true,
        snap: false,
        sx: 1.12,
        sy: 1.06,
        hoverIdx: this._nearest(this.data.bx),
        blobOn: true
      });
      if (wx.vibrateShort) {
        try {
          wx.vibrateShort({ type: 'light', fail() {} });
        } catch (err) {
          // 部分机型不支持，忽略
        }
      }
      this.triggerEvent('hold');
    },

    onMove(e) {
      const t = e.touches[0];

      if (!this._liquid) {
        // 长按还没到点就滑开了 → 用户是在滚页面，撤掉长按
        if (
          Math.abs(t.clientX - this._startX) > MOVE_TOL ||
          Math.abs(t.clientY - this._startY) > MOVE_TOL
        ) {
          clearTimeout(this._holdTimer);
        }
        return;
      }

      const w = this._rect.width;
      const left = this._center(0);
      const right = this._center(this.data.items.length - 1);
      let x = t.clientX - this._rect.left;
      x = Math.max(left, Math.min(right, x));

      // 速度 → 横向拉伸、纵向压扁，看起来像被手拖着走的液体
      const now = Date.now();
      const dt = Math.max(now - this._lastT, 8);
      const v = (t.clientX - this._lastX) / dt; // px/ms
      this._lastX = t.clientX;
      this._lastT = now;

      const k = Math.min(1 + Math.abs(v) * 0.35, 1.4);
      const near = this._nearest(x);
      const patch = {
        bx: x,
        sx: 1.12 * k,
        sy: 1.06 / Math.sqrt(k)
      };
      if (near !== this.data.hoverIdx) patch.hoverIdx = near;
      this.setData(patch);
    },

    onEnd() {
      clearTimeout(this._holdTimer);
      if (!this._liquid) return;

      this._liquid = false;
      // 吞掉这次抬手后合成的 tap，避免跳两次（用时间窗，避免标志位卡住吞下一次正常点击）
      this._suppressUntil = Date.now() + 350;

      const i = this._nearest(this.data.bx);
      const key = this.data.items[i].key;
      const remain = key === this.data.curKey;

      this.setData({
        liquid: false,
        snap: true,
        sx: 1,
        sy: 1,
        hoverIdx: -1,
        bx: this._center(i),
        curKey: key,
        blobOn: remain ? this.data.blobOn : key !== 'publish'
      });

      if (!remain) {
        const url = this.data.items[i].url;
        this.triggerEvent('tab', { url });
        this.triggerEvent('go', { url });
      }
    },

    onTap(e) {
      if (Date.now() < (this._suppressUntil || 0)) return;
      const url = e.currentTarget.dataset.url;
      // 同时触发 tab 和 go，兼容全量历史页面事件监听
      this.triggerEvent('tab', { url });
      this.triggerEvent('go', { url });
    }
  }
});
