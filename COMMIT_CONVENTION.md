# Commit Message Convention

## 格式

```
[type][scope] message
```

## 类型 (Type)

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `[feat] Add search functionality` |
| `fix` | Bug 修复 | `[fix] Resolve build error` |
| `refactor` | 重构代码 | `[refactor] Optimize data loading` |
| `docs` | 文档更新 | `[docs] Update README` |
| `style` | 代码格式 | `[style] Format code` |
| `perf` | 性能优化 | `[perf] Improve loading speed` |
| `chore` | 构建/工具 | `[chore] Update dependencies` |
| `bot` | 自动化提交 | `[bot] Update data: 9 repos, 58 papers` |

## 来源 (Scope)

| 来源 | 说明 |
|------|------|
| `api` | API 相关 |
| `ui` | 用户界面 |
| `data` | 数据相关 |
| `scraper` | 爬虫脚本 |
| `deploy` | 部署相关 |

## 示例

```bash
# 自动化数据更新
git commit -m "[bot][data] Update repos: 9 GitHub projects"

# 新功能
git commit -m "[feat][ui] Add blog tab"

# Bug 修复
git commit -m "[fix][api] Resolve GitHub API error"

# 重构
git commit -m "[refactor][data] Migrate to real-time API"

# 部署
git commit -m "[chore][deploy] Update Vercel config"
```

## 快速提交命令

```bash
# 自动化提交
./scripts/commit.sh "Update data: X repos, Y papers"

# 带类型提交
./scripts/commit.sh "feat" "Add new feature"
```
