const nav = require('../../utils/nav.js');
const favorites = require('../../utils/favorites.js');
const catalog = require('../../utils/catalog.js');
Page({data:{list:[]},onShow(){this.setData({list:favorites.all().map(x=>Object.assign({},x,{available:!!catalog.detail(x.id)}))});},open(e){const id=e.currentTarget.dataset.id;if(!catalog.detail(id)){wx.showToast({title:'已下架或不在当前校园集市',icon:'none'});return;}nav.go('/pages/detail/detail?id='+encodeURIComponent(id));},remove(e){const item=favorites.all().find(x=>String(x.id)===String(e.currentTarget.dataset.id));if(item)favorites.toggle(item);this.onShow();}});
