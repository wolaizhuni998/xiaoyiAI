# 校易AI 接口清单（给后端队友）

> 前端已就位：`miniprogram/utils/api.js` 统一请求层，默认 **mock 演示模式**（`storage.apiMock='1'`）。
> 后端就绪后：① 改 `api.js` 顶部 `BASE_URL`；② 我的→设置 关闭「数据模式」开关（或 `setApiMode(false)`）。
> 通用约定：请求/响应均 JSON；列表统一 `{ "list": [...] }`；错误统一 `{ "code": <http码或业务码>, "msg": "..." }`。

## 0. 鉴权

1. `POST /auth/sms` 发验证码
   - 入参：`{ "phone": "13800000000" }`（11 位手机号）
   - 出参：`{ "sent": true, "hint": "..." }`
2. `POST /auth/login` 手机号+验证码登录
   - 入参：`{ "phone": "...", "code": "123456" }`
   - 出参：`{ "token": "xxx", "user": { "nick": "...", "avatar": "...", "phone": "..." } }`
3. 之后所有需登录接口带请求头：`Authorization: Bearer <token>`；返回 **401** 前端自动清 token 并跳转登录页。
4. **发布（二手）与求购必须登录**才能提交；列表/详情/搜索不需要登录。

## 1. 用户

| 方法 | 路径 | 说明 | 入参 | 出参 |
|---|---|---|---|---|
| GET | `/user/profile` | 读我的资料（头像/昵称） | - | `{ nick, avatar, phone }` |
| POST | `/user/profile/update` | 改昵称/头像 | `{ nick?, avatar头像url? }` | `{ ok: 1, user: {...} }` |

> avatar 上传可另给 `POST /user/upload`（multipart 或直传 OSS，前端拿到 url 后走 update）。

## 2. 商品（首页 / 发现 / 详情）

| 方法 | 路径 | 说明 | 入参 | 出参 |
|---|---|---|---|---|
| GET | `/home/list` | 首页列表（双 Tab：热门/最新） | `tag`(综合/价格/成色/地点), `kw` 关键词, `tab`(hot/new) | `{ list: [{ id, icon, title, price, cond, place, seller? }] }` |
| GET | `/find/list` | 发现页分类列表 | `cat`(数码/书籍教材/…), `kw`, `sort` | 同上 |
| GET | `/goods/detail` | 商品详情 | `id` | `{ id, title, price, cond, place, desc, imgs, seller }` |
| POST | `/goods/publish` | **发布二手（需登录）** | `{ title, price, cond, place, cat, desc, imgs }` | `{ id }` |
| POST | `/goods/offline` | 下架/删除自己的商品（需登录） | `{ id }` | `{ ok: 1 }` |

## 3. 求购

| 方法 | 路径 | 说明 | 入参 | 出参 |
|---|---|---|---|---|
| GET | `/wants/list` | 求购列表 | `cat`, `kw` | `{ list: [{ id, cat, kw, deg?, user? }] }` |
| POST | `/wants/publish` | **发布求购（需登录）** | `{ cat, kw, deg? }` | `{ id }` |

## 4. 聊天

| 方法 | 路径 | 说明 | 入参 | 出参 |
|---|---|---|---|---|
| POST | `/chat/send` | 发消息（需登录） | `{ to, msg }` | `{ id, reply? }`（Demo 期由后端返回固定/规则回复亦可） |
| GET | `/chat/threads` | 会话列表（可选，二期） | - | `{ list: [{ from, last, time }] }` |

## 5. AI 推荐

| 方法 | 路径 | 说明 | 入参 | 出参 |
|---|---|---|---|---|
| POST | `/ai/recommend` | 猜你喜欢重排 | `{ campus, kw, tag, pool? }`（pool 可不传，后端自取全量） | `{ list: [...] }` |

## 6. 定位（预留，非必须）

- 前端已用 `wx.getLocation`（gcj02）拿经纬度，随 `/home/list` 传 `lat/lng` 做「离我最近」排序即可；后端不需要主动调地图 API（除非要逆地理编码成校区名——可选 `GET /campus/nearby?lat&lng` → `{ campus: "砚湖大学" }`）。

## 7. Mock 对照（前端 mock 已实现的路径，后端按同名路径实现即可无缝切换）

`/auth/sms` `/auth/login` `/user/profile` `/user/profile/update` `/home/list` `/find/list` `/wants/list` `/wants/publish` `/goods/publish` `/chat/send` `/ai/recommend`

> 前端 mock 与上表路径完全一致，后端按同名路径实现即可无缝切换（无隐藏差异）。
