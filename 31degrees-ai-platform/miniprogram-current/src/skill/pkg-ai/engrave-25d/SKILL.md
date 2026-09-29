# SKILL: 31度2.5D内雕定制（engrave25d）

## 业务说明
本技能封装「31度AI定制」小程序的核心定制能力：把用户上传的照片或文字描述，经云端 AI 流水线（画质增强 → 智能抠图 → 深度估计 → 灰度/点阵转换）生成激光内雕/打标可用的加工文件包，并支持活动拍照机风格化与 AI 纪念币制作。

## 原子接口一览
| 接口 | 说明 | 结果卡片 | 接力页面 |
|---|---|---|---|
| startPhotoEngraving | 照片转2.5D加工包（含AI优化开关） | engrave-card | /pages/image25d/index |
| generateTextTo25D | 文生2.5D（描述→2D图→深度图→2.5D预览） | engrave-card | /pages/text25d/index |
| makeAIStylePhoto | AI拍照机风格大片（抠图换背景） | engrave-card | /pages/photobooth/index |
| makeAICommemorativeCoin | AI纪念币（环绕文字+金银材质） | coin-card | /pages/coin/index |
| queryEngravingStatus | 查询订单/加工进度 | 无卡片 | /pages/orders/index |

## 典型流程
1. 用户发送照片并说「帮我转成2.5D内雕图」→ 调 startPhotoEngraving（默认 optimize=false）。
2. 用户说「照片不满意，先优化一下」→ startPhotoEngraving（optimize=true）。
3. 用户说「做一枚纪念币，顶部写清凉夏日，底部写31度科技·2026」→ makeAICommemorativeCoin。
4. 用户说「生成一只星空下的小猫的2.5D摆件」→ generateTextTo25D。
5. 用户说「活动照片换个夏日背景」→ makeAIStylePhoto（template=summer）。
6. 用户问「我的订单好了吗」→ queryEngravingStatus。

## 注意事项
- 所有接口返回 handoff，用户点击「账号卡片」进入接力页面，可在页面中继续调整参数并提交打样。
- 图片格式 png/jpg、单张≤10M 由接口校验，失败时以 isError 引导用户重新发送。
- 加工文件（BMP/STL/G-code）为中间文件，最终设备项目由 PC 客户端/设备软件转换。
- 彩印风格化不调用深度图或2.5D服务；生成风格图后仍须在已有页面选择成品、确认合成预览和询价，不表示已付款或已打印。
- 查询指定设备订单时只读取该订单；询价编号、文件处理任务编号不是设备订单编号。`partial=true` 时明确告知部分查询失败，不能回答“没有订单”。
- 文件处理完成只表示数字文件已处理，不表示实物加工、交付或售后验收完成。
