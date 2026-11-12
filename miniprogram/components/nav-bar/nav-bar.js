Component({
  properties: {
    title: { type: String, value: '' },
    // 一般不用传：页面栈 > 1 时自动显示返回
    back: { type: Boolean, value: false }
  },
  data: {
    sbh: 44, // 状态栏高度 px
    h: 88, // 整条高度 px
    canBack: false
  },
  attached() {
    let sbh = 44;
    try {
      const info = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()) || {};
      sbh = info.statusBarHeight || 44;
    } catch (e) {
      sbh = 44;
    }
    this.setData({ sbh: sbh, h: sbh + 44 });
  },
  pageLifetimes: {
    // 每次页面显示都重算一次：页面栈变化后返回键要跟着出现/消失
    show() {
      let n = 0;
      try { n = getCurrentPages().length; } catch (e) { n = 0; }
      const canBack = this.data.back || n > 1;
      if (canBack !== this.data.canBack) this.setData({ canBack: canBack });
    }
  },
  methods: {
    onBack() {
      let n = 0;
      try { n = getCurrentPages().length; } catch (e) { n = 0; }
      if (n > 1) {
        wx.navigateBack({ delta: 1 });
      } else {
        // 从分享/扫码直接进来时栈里只有自己，退回首页而不是卡死
        wx.reLaunch({ url: '/pages/home/home' });
      }
    }
  }
});
