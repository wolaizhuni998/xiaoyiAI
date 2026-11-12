// 消息页：会话列表（点击进入聊天）
const nav = require('../../utils/nav.js');
const ui = require('../../utils/ui.js');

Page(ui.toneAware({
  data: {
    sessions: [
      { id: 's1', title: '同窗甲', brief: '教材下午在图书馆门口给你', time: '10:24' },
      { id: 's2', title: '同窗乙', brief: '键盘还在的，可以小刀', time: '昨天' },
      { id: 's3', title: '同窗丙', brief: '好的，成交', time: '周一' }
    ]
  },
  onLoad() { },
  onTab(e) {
    const url = e.detail.url;
    if (url.indexOf('/pages/msg/') > -1) return;
    nav.switchTo(url);
  },
  open(e) {
    const d = e.currentTarget.dataset.d;
    nav.go('/pages/chat/chat?from=' + encodeURIComponent(d.title));
  }
}));
