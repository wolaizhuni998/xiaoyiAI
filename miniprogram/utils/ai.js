// 仅开发联调。模型密钥始终只保存在服务端环境变量。
const CONFIG_KEY = 'aiProxyConfig';
function assess(form, photos) {
 const config = wx.getStorageSync(CONFIG_KEY);
 if (!config || !config.url || !config.token) return Promise.reject({msg:'请先在开发者工具配置 aiProxyConfig（url、token）'});
 return Promise.all(photos.map(path => new Promise((resolve,reject) => wx.getFileSystemManager().readFile({filePath:path,encoding:'base64',success:r=>resolve('data:image/'+(/\.png$/i.test(path)?'png':'jpeg')+';base64,'+r.data),fail:()=>reject({msg:'读取图片失败，请重新选择'})}))))
 .then(images => new Promise((resolve,reject) => wx.request({url:config.url.replace(/\/$/,'')+'/ai/assess',method:'POST',timeout:65000,header:{'Content-Type':'application/json',Authorization:'Bearer '+config.token},data:{...form,images},success:r=>r.statusCode===200?resolve(r.data):reject({msg:r.data.msg||'AI分析失败'}),fail:()=>reject({msg:'AI服务连接失败，请重试'})})));
}
module.exports={assess};
