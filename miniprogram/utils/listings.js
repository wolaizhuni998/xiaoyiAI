// 本地演示业务仓库；正式权限、认证和审核必须由服务端执行。
const KEY = 'demoListings';
function all() { return wx.getStorageSync(KEY) || []; }
function publish(d, user) {
  if (!user || !user.phone || !user.demoVerified) throw new Error('请先使用已认证演示账号');
  if (!d.title.trim() || !d.desc.trim() || !d.imgs.length || !d.cat || !d.cond || !d.place || !d.school || !d.campus) throw new Error('请补全商品信息、描述和照片');
  if (d.price !== '面议' && !(Number(String(d.price).replace('¥', '')) > 0)) throw new Error('价格无效');
  const previous = d.editId ? all().find(x => x.id === d.editId) : null;
  if (d.editId && (!previous || previous.owner !== user.phone || !['rejected', 'offline'].includes(previous.status))) throw new Error('仅可修改自己的未通过或已下架商品');
  if (previous && (!d.aiReport || !d.aiReport.reportId || d.aiReport.reportId === previous.aiReport?.reportId)) throw new Error('修改后必须重新进行AI审核');
  const item = Object.assign({}, d, { id: previous ? previous.id : 'g' + Date.now(), revision: previous ? (previous.revision || 1) + 1 : 1, owner: user.phone, sellerName: user.nick || '本校同学', status: 'pending', photos: d.imgs, createdAt: Date.now() });
  wx.setStorageSync(KEY, [item].concat(all().filter(x => x.id !== item.id))); return item;
}
function review(id, approved, reason) {
  const list = all(); const item = list.find(x => x.id === id);
  if (!item || item.status !== 'pending') throw new Error('商品状态已变化');
  if (approved && (!item.aiReport || (item.aiReport.decision !== 'pass' || item.aiReport.imageReview?.kind !== 'real' || item.aiReport.imageReview?.complete !== true))) throw new Error('图片或AI审核未通过，请补充实物照片后重新提交');
  item.reviewReason = approved ? '审核通过' : (reason || '请检查完整实物图片、商品描述和AI审核提示后重新提交');
  item.reviewedAt = Date.now();
  item.status = approved ? 'approved' : 'rejected'; wx.setStorageSync(KEY, list); return item;
}
function offline(id, user) {
  const list = all(); const item = list.find(x => x.id === id);
  if (!user || !item || item.owner !== user.phone) throw new Error('只能下架自己的商品');
  if (!['approved', 'pending'].includes(item.status)) throw new Error('当前商品不可下架');
  item.status = 'offline'; item.offlinedAt = Date.now();
  wx.setStorageSync(KEY, list); return item;
}
module.exports = { all, publish, review, offline };
