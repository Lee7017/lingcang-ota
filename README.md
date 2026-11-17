# 灵仓 OTA 与公开状态数据

本仓库分工：
- **GitHub Releases**：存放灵仓各平台的 React 前端 OTA 更新包。
- **support/ios.json**：公开的 iOS / iPadOS 开发支持进度，仅含经过筛选的统计数据。
- **GitHub Actions**：定时查询爱发电订单；只更新 support/ios.json，不构建或部署灵仓官网。

灵仓官网：https://lee7017.github.io/lingcang/

注意：这里的 JSON **绝不存放**手机号、真实姓名、完整订单、留言、私人 ID 或 API 密钥。爱发电 API 密钥只能放在本仓库 Actions Secrets 中。

当前支持统计尚未接入爱发电账号，显示“尚未同步”；不要把未接入状态误当成真实的 0 元支持。
