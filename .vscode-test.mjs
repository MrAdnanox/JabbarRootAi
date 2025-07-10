import { defineConfig } from '@vscode/test-cli/out/index.cjs';

export default defineConfig({
	files: 'out/test/**/*.test.js',
});
