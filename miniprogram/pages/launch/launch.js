// 开屏启动页：展示字标 1.2s 后自动 reLaunch 首页（不保留返回栈）
Page({
  data: {},

  onLoad() {
    wx.setNavigationBarTitle({ title: '' });
    this._timer = setTimeout(() => {
      this.enter();
    }, 1200);
  },

  onUnload() {
    clearTimeout(this._timer);
  },

  onHide() {
    clearTimeout(this._timer);
  },

  enter() {
    clearTimeout(this._timer);
    wx.reLaunch({
      url: '/pages/home/home',
      fail: () => {
        // reLaunch 失败时停在启动页并给出提示（不静默白屏）
        wx.showToast({ title: '进入失败，请重试', icon: 'none' });
      }
    });
  }
});
