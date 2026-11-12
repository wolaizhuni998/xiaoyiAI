// 设置页：主题色 + 数据模式开关
const api = require('../../utils/api.js');
const ui = require('../../utils/ui.js');

Page(ui.toneAware({
  data: {
    mock: true,
    tones: ui.TONES,
    toneColor: '#007aff'
  },
  onLoad() {
    this.setData({ mock: api.apiMode(), toneColor: this._colorOf(ui.toneOf()) });
  },
  onShow() {
    this.setData({ toneColor: this._colorOf(ui.toneOf()) });
  },
  _colorOf(id) {
    for (let i = 0; i < ui.TONES.length; i++) {
      if (ui.TONES[i].id === id) return ui.TONES[i].color;
    }
    return '#007aff';
  },
  pickTone(e) {
    const id = e.currentTarget.dataset.id;
    if (id === this.data.tone) return;
    ui.setTone(id);
    this.setData({ tone: id, toneColor: this._colorOf(id) });
  },
  onMock(e) {
    const mock = !!e.detail.value;
    api.setApiMode(mock);
    this.setData({ mock: mock });
    wx.showToast({
      title: mock ? '演示数据（mock）' : '真实接口模式',
      icon: 'none'
    });
  }
}));
