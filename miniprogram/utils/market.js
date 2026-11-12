// 前端演示名单；正式名单由业务服务提供，不代表校园认证。
const schools = [
  { name: '砚湖大学（演示）', campuses: ['主校区', '东校区'] },
  { name: '青禾大学（演示）', campuses: ['主校区', '南校区'] }
];
function current() { return wx.getStorageSync('marketSelection') || null; }
function save(school, campus) { wx.setStorageSync('marketSelection', { school, campus }); }
function matches(item, market) { return !!market && item.school === market.school && item.campus === market.campus; }
module.exports = { schools, current, save, matches };
