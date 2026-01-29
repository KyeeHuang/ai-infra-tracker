#!/bin/bash
# scripts/commit.sh - 自动化提交工具
# 用法: ./scripts/commit.sh [type] [message]

TYPE=$1
MESSAGE=$2
BOT="[bot]"

if [ -z "$TYPE" ] || [ -z "$MESSAGE" ]; then
    echo "用法: ./scripts/commit.sh [type] [message]"
    echo ""
    echo "类型: feat, fix, refactor, docs, style, perf, chore, bot"
    echo ""
    echo "示例:"
    echo "  ./scripts/commit.sh bot 'Update data: 9 repos, 58 papers'"
    echo "  ./scripts/commit.sh feat 'Add new feature'"
    exit 1
fi

# 构建 commit message
if [ "$TYPE" == "bot" ]; then
    COMMIT_MSG="$BOT $MESSAGE"
else
    COMMIT_MSG="[$TYPE] $MESSAGE"
fi

echo "📝 Commit Message: $COMMIT_MSG"
git add -A
git commit -m "$COMMIT_MSG"
git push origin main

echo ""
echo "✅ 已提交并推送！"
