// 登录页：手机号 + 验证码；mock 下任意 11 位手机号 / 任意验证码可过
const api = require('../../utils/api.js');
const ui = require('../../utils/ui.js');

Page(ui.toneAware({
  data: {
    phone: '',
    code: '',
    counting: 0
  },
  onLoad() { },
  onUnload() { if (this._timer) { clearInterval(this._timer); this._timer = null; } },
  onPhone(e) { this.setData({ phone: e.detail.value }); },
  onCode(e) { this.setData({ code: e.detail.value }); },

  sendCode() {
    const phone = (this.data.phone || '').trim();
    if (!/^1\d{10}$/.test(phone)) { wx.showToast({ title: '请输入 11 位手机号', icon: 'none' }); return; }
    if (this.data.counting > 0) return;
    api.post('/auth/sms', { phone }).then((res) => {
      wx.showToast({ title: res.hint || '验证码已发送', icon: 'none' });
      this.setData({ counting: 60 });
      this._timer = setInterval(() => {
        const n = this.data.counting - 1;
        if (n <= 0) {
          if (this._timer) { clearInterval(this._timer); this._timer = null; }
          this.setData({ counting: 0 });
        } else {
          this.setData({ counting: n });
        }
      }, 1000);
    }).catch((err) => {
      wx.showToast({ title: (err && err.msg) || '发送失败', icon: 'none' });
    });
  },

  testLogin() {
    if (!api.apiMode()) return;
    api.setToken('mock-test-account');
    api.saveProfile({ phone: '13800000001', nick: '上架测试同学', demoVerified: true });
    require('../../utils/market.js').save('砚湖大学（演示）', '主校区');
    wx.reLaunch({ url: '/pages/publish/publish' });
  },
  login() {
    const phone = (this.data.phone || '').trim();
    const code = (this.data.code || '').trim();
    if (!/^1\d{10}$/.test(phone)) { wx.showToast({ title: '请输入 11 位手机号', icon: 'none' }); return; }
    if (!code) { wx.showToast({ title: '请输入验证码', icon: 'none' }); return; }
    api.post('/auth/login', { phone, code }).then((res) => {
      api.setToken(res.token);
      if (res.user) api.saveProfile(res.user);
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        const pages = getCurrentPages();
        if (pages.length > 1) {
          wx.navigateBack({ fail: () => { wx.reLaunch({ url: '/pages/mine/mine' }); } });
        } else {
          wx.reLaunch({ url: '/pages/mine/mine' });
        }
      }, 500);
    }).catch((err) => {
      wx.showToast({ title: (err && err.msg) || '登录失败', icon: 'none' });
    });
  }
}));
