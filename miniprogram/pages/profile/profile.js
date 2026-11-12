const market = require('../../utils/market.js');
// 个人资料页：头像 + 昵称设置（mock：本地保存即可演示）
const api = require('../../utils/api.js');
const ui = require('../../utils/ui.js');

Page(ui.toneAware({
  data: {
    schools: market.schools.map(s => s.name),
    campuses: [], school: '', campus: '',
    avatar: '',
    nick: '',
    phone: '',
    defaultCh: '砚'
  },
  onLoad() {
    const selected = market.current();
    if (selected) { const school = market.schools.find(s => s.name === selected.school); this.setData({ school: selected.school, campus: selected.campus, campuses: school ? school.campuses : [] }); }
    const p = api.profileOf();
    this.setData({
      avatar: p.avatar || '',
      nick: p.nick || '',
      phone: p.phone || ''
    });
  },
  onSchool(e) { const school = market.schools[Number(e.detail.value)]; this.setData({ school: school.name, campuses: school.campuses, campus: '' }); },
  onCampus(e) { this.setData({ campus: this.data.campuses[Number(e.detail.value)] }); },
  onNick(e) { this.setData({ nick: e.detail.value }); },

  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const f = res.tempFiles && res.tempFiles[0];
        if (f && f.tempFilePath) this.setData({ avatar: f.tempFilePath });
      }
    });
  },

  save() {
    if (!this.data.school || !this.data.campus) { wx.showToast({ title: '请选择学校和校区', icon: 'none' }); return; }
    const nick = (this.data.nick || '').trim();
    const avatar = this.data.avatar || '';
    if (!nick) { wx.showToast({ title: '请填写昵称', icon: 'none' }); return; }
    market.save(this.data.school, this.data.campus);
    const localSave = () => { api.saveProfile(Object.assign({}, api.profileOf(), { nick: nick, avatar: avatar })); };
    api.post('/user/profile/update', { nick: nick, avatar: avatar }).then((res) => {
      if (res && res.user) api.saveProfile(res.user); else localSave();
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => {
        if (getCurrentPages().length > 1) {
          wx.navigateBack({ fail: () => { wx.reLaunch({ url: '/pages/mine/mine' }); } });
        } else {
          wx.reLaunch({ url: '/pages/mine/mine' });
        }
      }, 500);
    }).catch(() => {
      // 真实接口未就绪也先落本地，演示不卡
      localSave();
      wx.showToast({ title: '已本地保存', icon: 'none' });
      setTimeout(() => {
        if (getCurrentPages().length > 1) {
          wx.navigateBack({ fail: () => { wx.reLaunch({ url: '/pages/mine/mine' }); } });
        } else {
          wx.reLaunch({ url: '/pages/mine/mine' });
        }
      }, 500);
    });
  }
}));
