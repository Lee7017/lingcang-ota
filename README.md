# PleaseJot · OTA 与公开支持统计

本仓库负责 PleaseJot 应用 OTA 更新资源，以及 iOS / iPadOS 开发支持统计数据。

- **官网**：https://lee7017.github.io/pleasejot/
- **官网仓库**：`Lee7017/pleasejot`（只展示公开数据，不调用爱发电）
- **公开 JSON**：[support/ios.json](./support/ios.json)
- **同步工作流**：[Sync iOS support statistics](./.github/workflows/ios-support.yml)
- **定时计划**：GitHub Actions 的最短间隔，每 5 分钟尝试运行一次（UTC 每小时的 03、08、13、…、58 分），也可管理员手动运行。

每次实际运行都用 OTA Actions Secrets 查询爱发电真实订单；金额、人数等变化时立即提交公开 JSON，数据没有变化时最短每 1 小时发布一次新的真实同步时间。GitHub `schedule` **可能延迟、漏跑甚至停止触发**，因此官网文案保守显示「每隔数小时更新」，并展示最后一次**真实成功查询**的时间，不承诺每 5 分钟完成同步。

如长期未刷新，请查看本仓库 Actions 的 **schedule 运行记录**。推送工作流或同步脚本也会触发一次查询，方便诊断；对 `support/ios.json` 的提交不会递归触发自身。

## 密钥和隐私

所需 Actions Secrets：`AFDIAN_USER_ID`、`AFDIAN_API_TOKEN`，以及可选的 `AFDIAN_PLAN_ID`（默认专用 iOS 方案 ID）。可选 Actions Variable：`AFDIAN_SUPPORT_URL`。这些信息只保存在本仓库的 Actions 中，**绝不写到官网前端或公开 JSON**。

公开 JSON 只包含目标、金额、支持人数、真实同步时间、支持页面和授权公开的支持者列表。不得存储手机号、订单号、留言、原始 API 响应和任何私有 ID。
