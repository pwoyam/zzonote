#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "🐳 Building Zzonote..."
docker run --rm -v "$(pwd)":/app -w /app zzonote-builder bash -c '
  set -e
  export PATH="/root/.cargo/bin:$PATH"
  pnpm install
  pnpm build
  pnpm tauri build
'
sudo chown -R $USER:$USER .
echo "✅ Done! Files in src-tauri/target/release/bundle/"
