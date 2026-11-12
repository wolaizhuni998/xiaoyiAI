const api = require('./api.js');
function key() { if (!api.isLoggedIn() || !api.profileOf().phone) return null; return 'favorites:' + api.profileOf().phone; }
function all() { const k = key(); return k ? wx.getStorageSync(k) || [] : []; }
function has(id) { return all().some(x => String(x.id) === String(id)); }
function toggle(item) { const k = key(); if (!k) throw new Error('请先登录'); const list = all(); const exists = has(item.id); wx.setStorageSync(k, exists ? list.filter(x => String(x.id) !== String(item.id)) : [Object.assign({}, item)].concat(list)); return !exists; }
module.exports = { all, has, toggle };
