import { build } from 'esbuild';
import { existsSync, copyFileSync } from 'fs';

// No bot imports, no async/await. Only raw, synchronous GAS entry.
const autoEntryCode = `
import { TelegramBot, GasApiClient } from './src/index';

globalThis.doPost = async (e) => {
  try {
    if (!e || !e.postData || !e.postData.contents) return;
    const update = JSON.parse(e.postData.contents);

    const token = PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');
    
    if (!token) {
      console.error("Error: BOT_TOKEN not found in Script Properties!");
      return;
    }

    const Bot = new TelegramBot(new GasApiClient(token));
    await Bot.handleUpdate(update);
  } catch (err) {
    console.error("Critical Webhook Error: " + err);
  }
};
`;

build({
  stdin: {
    contents: autoEntryCode,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  outfile: 'gas-build/bundle.js',
  format: 'iife',
  footer: {
    js: 'function doPost(e) { return globalThis.doPost(e); }'
  },
}).then(() => {
  if (existsSync('src/appsscript.json')) {
    copyFileSync('src/appsscript.json', 'dist/appsscript.json');
  }
  console.log('✅ Bundle created!');
}).catch(() => process.exit(1));