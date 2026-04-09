#!/usr/bin/env sh

# ============================================================================
# Husky Pre-Commit Hook: Qodo AI Code Review
# ============================================================================
# Runs Qodo review on staged changes and blocks commits if blocking issues
# are detected based on keyword matching.
# ============================================================================

set +e

export CI=true

if ! command -v git >/dev/null 2>&1; then
  export PATH="/usr/bin:/usr/local/bin:/opt/homebrew/bin:$HOME/.local/bin:$PATH"
  if ! command -v git >/dev/null 2>&1; then
    echo "❌ Error: git command not found in PATH"
    echo "   Current PATH: $PATH"
    exit 1
  fi
fi

if ! command -v qodo >/dev/null 2>&1; then
  echo "⚠️  Qodo command not found. Skipping review."
  exit 0
fi

echo ""
echo "━━━━━━━━━━ QODO REVIEW ━━━━━━━━━━"
echo "▶ Running AI code review (Qodo)..."
echo "▶ (Streaming output below — this may take a few seconds)"
echo ""

QODO_TMP="$(mktemp)"
QODO_EXIT_TMP="$(mktemp)"
KEYWORD_TMP="$(mktemp)"
trap 'rm -f "$QODO_TMP" "$QODO_EXIT_TMP" "$KEYWORD_TMP"' EXIT

MAX_ATTEMPTS=2
attempt=1

while [ $attempt -le $MAX_ATTEMPTS ]; do
  if [ $attempt -gt 1 ]; then
    echo ""
    echo "⚠️  Retrying qodo review (attempt $attempt/$MAX_ATTEMPTS)..."
    echo ""
    sleep 1
  fi

  qodo review --ci 2>&1 | tee "$QODO_TMP"
  QODO_EXIT_CODE=${PIPESTATUS[0]}
  QODO_OUTPUT="$(cat "$QODO_TMP")"
  QODO_EXIT_CODE="$(cat "$QODO_EXIT_TMP")"

  if echo "$QODO_OUTPUT" | grep -iq "spawn git ENOENT"; then
    if [ $attempt -lt $MAX_ATTEMPTS ]; then
      > "$QODO_TMP"
      attempt=$((attempt + 1))
      continue
    else
      echo ""
      echo "❌ Commit blocked: Qodo failed to access Git after $MAX_ATTEMPTS attempts."
      echo "👉 This is usually a PATH issue. Please ensure git is in your PATH and retry."
      echo ""
      exit 1
    fi
  elif [ "$QODO_EXIT_CODE" -ne 0 ]; then
    echo ""
    echo "❌ Commit blocked: Qodo review failed with exit code $QODO_EXIT_CODE."
    exit 1
  else
    break
  fi
done

if [ -z "$QODO_OUTPUT" ]; then
  echo ""
  echo "❌ Commit blocked: No output from Qodo review."
  exit 1
fi

BLOCKING_KEYWORDS="
need to be addressed
need to be fixed
need attention
needs attention
need to surface
found several issues
found some issues
found issues
found an issue
blocking issue
likely cause runtime errors
might break
please address
please fix
cannot be merged
must be fixed,
must be corrected
"

FOUND_KEYWORD=""
echo "$BLOCKING_KEYWORDS" | while IFS= read -r keyword; do
  [ -z "$keyword" ] && continue

  SAFE_KEYWORD=$(printf '%s\n' "$keyword" | sed 's/[][\\.^$*+?{}|()]/\\&/g')

  if echo "$QODO_OUTPUT" | grep -Eiq "(^|[^[:alnum:]_])$SAFE_KEYWORD([^[:alnum:]_]|$)"; then
    echo "$keyword" > "$KEYWORD_TMP"
    break
  fi
done

if [ -f "$KEYWORD_TMP" ] && [ -s "$KEYWORD_TMP" ]; then
  FOUND_KEYWORD="$(cat "$KEYWORD_TMP")"
fi

if [ -n "$FOUND_KEYWORD" ]; then
  echo ""
  echo "❌ Commit blocked by Qodo review."
  echo "   Detected blocking phrase: \"$FOUND_KEYWORD\""
  echo ""
  echo "👉 Please review and fix the highlighted issues before committing."
  echo ""
  exit 1
fi

echo ""
echo "✅ Qodo review completed with no blocking issues."
echo "⚠️  Reminder: This review is AI-generated and may contain false positives or misses."
echo "   Please ensure the changes have been reviewed by a human."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit 0
