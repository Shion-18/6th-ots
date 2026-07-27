import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3003',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // `next dev` は既定で 3000 番を使うため、待ち受ける 3003 を明示的に渡す
    command: 'npm run dev -- --port 3003',
    // port 指定だと「listen 済み」だけで待機を打ち切ってしまい、初回コンパイル中の
    // リクエストが ERR_ABORTED になる。url 指定にして実レスポンスまで待つ
    url: 'http://localhost:3003',
    timeout: 120000,
    reuseExistingServer: true,
  },
});
