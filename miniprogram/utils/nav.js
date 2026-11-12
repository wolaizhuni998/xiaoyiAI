// 统一页面导航（墨迹转场已下线，改用原生转场 + 简单防抖）
// - go(url)        普通进入（详情、聊天、资料…）
// - switchTo(url)  自定义 tabbar 的页间切换（redirect，不堆栈）
// - back()         返回，栈空时回首页
let _lock = 0;
function _guard(fn) {
  const now = Date.now();
  if (now - _lock < 350) return; // 连点保护
  _lock = now;
  fn();
}
function go(url) {
  if (!url) return;
  _guard(function () {
    wx.navigateTo({ url: url });
  });
}
function switchTo(url) {
  if (!url) return;
  _guard(function () {
    wx.redirectTo({
      url: url,
      animationType: 'none', // tab 间瞬切，避免每次都从右侧滑入
      fail: function () { wx.reLaunch({ url: url }); }
    });
  });
}
function back() {
  _guard(function () {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ fail: function () { wx.reLaunch({ url: '/pages/home/home' }); } });
    } else {
      wx.reLaunch({ url: '/pages/home/home' });
    }
  });
}

module.exports = { go, switchTo, back };
