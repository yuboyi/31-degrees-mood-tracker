# 31度小程序：现用本机源码整合候选版

本目录来自本机 `E:\Jieyue_AI_Codex_Client\mini-program` 于 2026-09-29 的源码快照。当前为 uni-app + Vue 3，共 27 个主包页面、首页/我的两个底部入口，包括彩印喷墨、光学激光、AI工艺预检、模板、打样、作品、订单、门店和设备等已有功能。没有更换 AppID、后端、报价规则或微信发布环境。

GitHub `yuboyi/31-degrees-mood-tracker` 的 `31degrees-ai-platform/miniprogram-frontend` 为旧版原生四页目录。旧目录不能代表本机最新源码，也不能推断为线上发布版本。建议将本候选版放在 `31degrees-ai-platform/miniprogram-current`，保留旧目录并明确标为历史参考；不要混合复制 Vue 源码到原生旧目录。

## 开发与验证

使用 Node.js 和锁定的依赖，执行 `npm ci`，然后 `npm run build:mp-weixin`。开发者工具应导入 `dist/build/mp-weixin`；源码入口是 `src/pages.json`，`dist/dev` 的历史产物不代表当前源文件。H5 可使用 `npm run dev:h5` 本地预览，但微信登录、支付、扫码、设备加工和正式分享必须在对应环境单独验收。

本次仅复用已安装依赖完成隔离构建，未重新安装或升级依赖。构建与界面通过不等于真实订单、设备加工或线上验收。

## 数据来源与账号边界

产品、模板与订单沿用当前 API 契约 `src/utils/apiContract.mjs` 和 `src/api/index.ts`。客户与订单不得由本地营销文章或 Taskade 的独立数据库自动覆盖；对外投影需保留源系统、实体类型、原始记录ID、数据时间和版本。报价需当前审批版本，历史知识库金额不是当前销售报价。

发布私钥、访问令牌、环境凭据、客户数据、依赖目录和构建产物不属于源码提交。本次已排除发现的发布私钥。既有 manifest 的域名检查配置沿用原文件，没有在本次关闭安全检查；正式发布前仍需按微信规则配置合法域名并核对发布设置。

后端连通性验证使用 `node scripts/check-backend-contract.mjs`（只读、无凭据）。上传、发布、支付和生产操作不属于本候选版验收。
