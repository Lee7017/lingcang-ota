# PleaseJot · OTA 与公开状态数据

本仓库分工：
- **GitHub Releases**：存放 PleaseJot 各平台的 React 前端 OTA 更新包。
- **support/ios.json**：公开 iOS / iPadOS 开发支持进度，仅包含经过筛选的统计数据。
- **GitHub Actions**：定时查询爱发电订单，只更新 `support/ios.json`，不构建或部署 PleaseJot 官网。

**仓库更名约定：** 管理员将此仓库从 `Lee7017/lingcang-ota` 更名为 `Lee7017/pleasejot-ota`；官网主仓库另行更名为 `Lee7017/pleasejot`。

PleaseJot 官网（主仓库更名、GitHub Pages 重新部署后）：https://lee7017.github.io/pleasejot/

注意：公开统计 JSON **绝不存放**手机号、真实姓名、完整订单、留言、私人 ID 或 API 密钥。爱发电 API 密钥只能放在本仓库 GitHub Actions Secrets 中。

公开支持进度以 `support/ios.json` 的实际状态和同步时间为准；无法正常同步时不能把未知状态当成真实的 0 元支持。仓库改名本身不会改变原有统计脚本、GitHub Actions Secrets 或 OTA 包格式。
