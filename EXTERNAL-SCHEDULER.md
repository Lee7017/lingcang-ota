# iOS 支持统计：可靠的外部定时触发

## 为什么需要外部定时器

截至 2026-11-20（北京时间），本仓库出现过 GitHub Actions 的 `schedule` 事件连续约 8 小时没有创建工作流运行记录的情况。修改 cron 分钟数、把每小时触发次数从 2 增加到 6，均未消除此问题；最近一次自动触发是 2026-11-20 04:59（北京时间）。

同步工作流 `.github/workflows/ios-support.yml` 在真正被触发后可以正常访问爱发电、查询订单、提交 `support/ios.json`。

新加的 `.github/workflows/ios-support-watchdog.yml` 能检查同步时间是否超过 70 分钟，并使用同仓库 `GITHUB_TOKEN` 触发原工作流；已通过一次端到端 `workflow_dispatch` 验证。但它本身仍依赖 GitHub `schedule`，**不能解决 GitHub 定时事件整体延迟或丢失**。

要让自动更新不再只依赖 GitHub 的定时服务，需要部署真正独立的外部定时器。没有完成下面的外部定时器配置之前，**不能宣称已经根治自动更新问题**。

## 免费方案：cron-job.org

cron-job.org 支持免费的定时 HTTP POST 请求。它只负责调用 GitHub 的工作流触发 API，不接触爱发电的用户 ID、API Token 或订单内容。爱发电密钥继续只保存在 OTA 仓库的 GitHub Actions Secrets。

1. 在 https://github.com/settings/personal-access-tokens 创建 **Fine-grained personal access token**：
   - Resource owner：`Lee7017`。
   - Repository access：**Only select repositories** → `pleasejot-ota`。
   - Repository permissions：**Actions → Read and write**；其他权限保持最低，Metadata read 为 GitHub 默认必需项。
   - 设置合理有效期；到期前更新外部定时器中的 token。**绝不能把 token 提交进 GitHub、写入网页前端、截图或贴在聊天里**。
2. 在 https://cron-job.org/ 新建任务，建议每小时 UTC 的第 `05`、`35` 分钟执行（两次/小时）。实际运行间隔由这个服务决定，无须重建官网。
3. HTTP 请求设置：
   - URL：`https://api.github.com/repos/Lee7017/pleasejot-ota/actions/workflows/ios-support.yml/dispatches`
   - Method：`POST`
   - Header：`Authorization: Bearer <第1步生成的 token>`
   - Header：`Accept: application/vnd.github+json`
   - Header：`X-GitHub-Api-Version: 2022-11-28`
   - Header：`Content-Type: application/json`
   - Body：`{"ref":"main"}`
4. 保存后手动触发该任务一次。查看 GitHub 仓库的 [Actions → Sync iOS support statistics](https://github.com/Lee7017/pleasejot-ota/actions/workflows/ios-support.yml)，确认新增的工作流 **Event 是 `workflow_dispatch`，且运行成功**。不能只看外部调度器 HTTP 2xx 就认为数据已经同步成功。
5. 检查公开文件 `https://raw.githubusercontent.com/Lee7017/pleasejot-ota/main/support/ios.json` 的 `syncedAt` 是否按预期更新。统计代码会在金额、人数等信息变化时立刻发布；数据没变时，只有距上一份公开数据的同步时间达到 **1 小时**才会提交新的 `syncedAt`。这个时间必须来自真实成功查询订单，绝不通过前端假造。

## 验收标准

- 连续观察至少 24 小时：外部定时器按配置发出请求，OTA GitHub Actions 里对应出现 `workflow_dispatch` 运行记录，且工作流成功。
- 期间公开数据在 2 小时以上没有变化时，应检查外部服务日志及 GitHub Actions 的执行日志，不能简单理解为「没有新赞助」。
- 如过期、泄露或撤销 token，外部调度会返回授权错误；需要更新 token。不要把 GitHub Token 添加到 URL 查询参数（避免出现在访问日志中）。
- GitHub 自带 schedule 和仓库内 watchdog 继续作为补充触发。外部 HTTP 请求可以重复：原工作流已设置 `concurrency` 防止并发重叠，并按真实金额/同步时间决定是否提交。
- 本文仅提供配置方案；**创建 cron-job.org 账号、保存 token 和启用任务需要仓库所有者亲自完成。**
