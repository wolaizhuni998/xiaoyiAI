# 当前开发状态（2026-11-12）

校园集市前端与本地演示业务：学校校区隔离、搜索筛选、商品详情、面议价格、收藏、提交审核、AI报告展示、整改重新提交、下架及本地照片保存。

验证：Node.js 20+，执行 `npm test`。测试使用模拟微信API与模型响应，不代表微信真机验收或真实AI识别准确率。

AI代理配置见 [AI_SETUP.md](AI_SETUP.md)。真实模型尚未联调；需要服务端密钥及支持视觉的模型名称。校园认证、人工审核、商品数据和聊天仍为演示实现，尚不能用于真实交易；正式部署需要服务端权限、数据库、图片存储与消息服务。AI评分不能保证真伪或内部功能。

---

# 校易AI · 校园二手交易小程序

微信小程序原生开发（WXML / WXSS / JS），面向校园内的二手交易与求购撮合。界面走克制风：纯色主题底 + 液态玻璃顶栏 / 底栏，强调色由设置页调色盘统一驱动。

## 快速开始

1. 微信开发者工具 → 导入项目，选择本目录（`project.config.json` 所在目录）
2. `project.config.json` 里已配置 `miniprogramRoot: "miniprogram/"`，导入后直接编译即可
3. 默认使用 **mock 数据**，无需后端就能跑通全流程

> `project.private.config.json` 属于开发者工具的本地个人配置（本机路径、调试开关），已加入 `.gitignore`，不随仓库分发。首次导入后工具会自动生成一份。

## 目录结构

```
.
├── miniprogram/
│   ├── app.js / app.json / app.wxss    全局逻辑、路由与主题变量
│   ├── components/
│   │   ├── nav-bar/                    自绘玻璃顶栏（含状态栏占位、返回键）
│   │   └── ink-tabbar/                 液态水珠底栏（长按可拖动）
│   ├── pages/                          12 个页面
│   │   ├── launch/      启动页
│   │   ├── login/       手机号验证码登录
│   │   ├── home/        首页（热门 / 最新）
│   │   ├── detail/      商品详情
│   │   ├── publish/     发布二手
│   │   ├── wants/       求购列表
│   │   ├── wants-ok/    求购发布成功
│   │   ├── chat/        会话
│   │   ├── msg/         消息
│   │   ├── mine/        我的
│   │   ├── profile/     个人资料
│   │   └── settings/    设置（主题调色盘 / 数据模式）
│   └── utils/
│       ├── api.js                      统一请求层（mock ↔ 真实接口一键切换）
│       ├── ui.js                       主题色 TONES / setTone / 类目映射
│       └── nav.js                      路由封装 + 350ms 连点保护
├── project.config.json
└── API.md                              接口清单（给后端）
```

## 主题系统

`app.wxss` 定义了一组 CSS 变量，页面根节点挂 `.tone-*` 类即可整体换肤：

```css
page { --tone: #007aff; --bg: #fff; }
.tone-blue   { --tone: #007aff; --bg: #edf3ff; }
.tone-purple { --tone: #af52de; --bg: #f6effa; }
/* …共 10 套 */
```

`utils/ui.js` 的 `TONES` 是同一份色板的 JS 侧副本，`setTone()` 写入 storage，各页面读取后套到根节点；底栏水珠、顶栏、按钮都直接读 `var(--tone)`，所以一次设置全站生效。

## 底栏交互

`components/ink-tabbar/` 是一个会「长出水珠」的导航条：

- **轻点**：水珠从旧格子弹性滑到新格子
- **长按 0.26s**：水珠胀大 + 轻震，进入可拖状态
- **按住横拖**：水珠跟手，按拖动速度横向拉长、纵向压扁；经过的格子图标被顶起
- **松手**：水珠吸回最近格子，只有换了格子才跳转

实现要点：只保留**一颗**水珠（试过主体+尾巴两滴，交界处必然露出一圈深弧线，看起来是两个球）；水珠铺了 20% 的 `var(--tone)`，否则纯白水珠在白玻璃上完全看不出边界；胶囊本身不能 `overflow:hidden`（会裁掉中间上凸的发布钮），所以单独加了一层裁切容器。

## 切换真实后端

`miniprogram/utils/api.js` 顶部：

```js
const BASE_URL = 'https://your-api.example.com'; // 改成真实域名
```

然后「我的 → 设置」关掉**数据模式**开关（等价于 `setApiMode(false)`）。后端按 `API.md` 里同名路径实现即可无缝切换 —— mock 与真实接口的路径完全一致，没有隐藏差异。

> 占位域名有保护：`BASE_URL` 还是 `your-api.example.com` 时即使开了真实接口也只走 mock，不会刷网络错误。

## 已知限制

- **Android 微信不支持 `backdrop-filter`**，玻璃效果在安卓上会退化为半透明白底 + 细描边，这是平台限制，不是 bug。
- 无暗色模式。
- 商品图为项目内置的线条图标（走 CSS `data:` URI），不依赖网络图床。
- 真机手感（水珠跟手度、震动反馈）未在实机验证过。觉得太黏或太飘，调 `ink-tabbar.js` 里 `HOLD_MS` 和 `k` 的系数。

## License

未指定。
