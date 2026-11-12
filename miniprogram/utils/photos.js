// 演示模式将照片复制到用户数据目录，避免临时路径过期。
function persist(paths) {
 const fs = wx.getFileSystemManager();
 return Promise.all(paths.map((path, index) => {
  if (path.indexOf(wx.env.USER_DATA_PATH + '/') === 0) return Promise.resolve(path);
  const ext = /\.(png|webp)$/i.exec(path);
  const target = wx.env.USER_DATA_PATH + '/goods-' + Date.now() + '-' + index + '-' + Math.random().toString(36).slice(2) + '.' + (ext ? ext[1] : 'jpg');
  return new Promise((resolve,reject) => fs.copyFile({srcPath:path,destPath:target,success:()=>resolve(target),fail:()=>reject({msg:'照片保存失败，请检查存储空间后重试'})}));
 }));
}
module.exports = { persist };
