# PleaseJot · OTA 仓库

本仓库只保留 PleaseJot 的应用更新（OTA）相关资源；官网和公开 iOS 开发支持数据已迁至 [官网主仓库](https://github.com/Lee7017/pleasejot)。

- **官网主仓库**：`Lee7017/pleasejot`
- **官网地址**：https://lee7017.github.io/pleasejot/
- **iOS 开发支持统计**：[官网仓库的 `support/ios.json`](https://github.com/Lee7017/pleasejot/blob/main/support/ios.json)
- **赞助统计更新方式**：官网仓库的 [Manual iOS support sync](https://github.com/Lee7017/pleasejot/actions/workflows/ios-support-manual.yml)，由管理员手动触发。

OTA 仓库中的定时同步、watchdog、统计脚本和旧 `support/ios.json` 均已删除；**本仓库不再自动查询爱发电，也不再发布赞助统计数据**。

API 密钥只能存放在官网主仓库的 GitHub Actions Secrets 中，不应放进网站源码或公开 JSON。
