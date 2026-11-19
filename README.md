# PleaseJot · OTA 与公开状态数据

本仓库分工：
- **GitHub Releases**：存放 PleaseJot 各平台的 React 前端 OTA 更新包。
- **support/ios.json**：公开 iOS / iPadOS 开发支持进度，仅包含经过筛选的统计数据。
- **GitHub Actions**：定时查询爱发电订单，只更新 `support/ios.json`，不构建或部署 PleaseJot 官网。

**当前仓库：** `Lee7017/pleasejot-ota`；**官网主仓库：** `Lee7017/pleasejot`。

PleaseJot 官网：https://lee7017.github.io/pleasejot/

注意：公开统计 JSON **绝不存放**手机号、真实姓名、完整订单、留言、私人 ID 或 API 密钥。爱发电 API 密钥只能放在本仓库 GitHub Actions Secrets 中。

公开支持进度以 `support/ios.json` 的实际状态和同步时间为准；无法正常同步时不能把未知状态当成真实的 0 元支持。统计脚本、GitHub Actions Secrets 与 OTA 包格式保持原有约定。

**自动同步说明：** GitHub Actions `schedule` 已出现连续约 8 小时没有触发事件的情况。原工作流与新增的独立 watchdog 虽然可以在触发后正常执行，但都无法保证 GitHub 的定时事件准时到达。要解决自动更新的长期可靠性，需在 GitHub 以外配置独立定时触发器，具体见 [外部定时器配置与验收说明](./EXTERNAL-SCHEDULER.md)。在外部触发器真正启用并观察通过之前，不得宣称此问题已完全解决。
