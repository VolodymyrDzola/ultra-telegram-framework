# 📂 Handling & Downloading Files

Bots often need to receive files from users—whether it's a profile picture, a PDF document, or a voice message. 

However, to save bandwidth, Telegram **does not** send the actual file contents inside the webhook update. Instead, it sends a lightweight `file_id`. 

To actually download the file, you must follow a strict 3-step process. The **Ultra Telegram Framework (UTF)** makes this straightforward using the `ctx.api` and strongly-typed update objects.

---

## 🏗️ The 3-Step Download Process

1. **Extract the `file_id`** from the incoming message.
2. **Request the `file_path`** from Telegram using `ctx.api.getFile()`.
3. **Download the binary data** from Telegram's special file server URL.

### 1. Extracting the `file_id`

Using UTF's `Composer` and `bot.on()`, we can easily filter for specific media types and extract their IDs with perfect TypeScript autocompletion.

```typescript
bot.on('message:document', async (ctx) => {
  // TypeScript knows that document exists here!
  const fileId = ctx.update.message.document.file_id;
  const fileName = ctx.update.message.document.file_name;
  
  await ctx.reply(`I received your document: ${fileName}. Processing...`);
});

bot.on('message:photo', async (ctx) => {
  // Photos are sent as an array of different sizes. 
  // The last element is always the highest resolution.
  const photos = ctx.update.message.photo;
  const bestResolution = photos[photos.length - 1];
  const fileId = bestResolution.file_id;
  
  await ctx.reply("What a nice photo!");
});

```

### 2. Requesting the File Path

Once you have the `file_id`, you must ask Telegram's API where exactly this file is stored on their servers.

```typescript
// Inside your handler...
const fileInfo = await ctx.api.getFile({ file_id: fileId });

// Telegram returns a file_path, e.g., "documents/file_123.pdf"
console.log(fileInfo.file_path); 

```

### 3. Constructing the URL and Downloading

Telegram hosts files on a specific URL structure that requires your Bot Token:
`https://api.telegram.org/file/bot<YOUR_BOT_TOKEN>/<file_path>`

How you download this file depends on your environment (Node.js vs. GAS).

---

## 💾 Example 1: Node.js / Edge Environment

If you are running your bot on a standard Node.js server or Cloudflare Workers, you can use the native `fetch` API to get an `ArrayBuffer` or save it to your disk.

```typescript
import fs from 'fs';

const TOKEN = 'YOUR_TELEGRAM_TOKEN';

bot.on('message:voice', async (ctx) => {
  const fileId = ctx.update.message.voice.file_id;
  
  // 1. Get the path
  const fileInfo = await ctx.api.getFile({ file_id: fileId });
  
  // 2. Construct URL
  const downloadUrl = `https://api.telegram.org/file/bot${TOKEN}/${fileInfo.file_path}`;
  
  // 3. Download the file using native fetch
  const response = await fetch(downloadUrl);
  const buffer = await response.arrayBuffer();
  
  // 4. Save to disk (Node.js only)
  fs.writeFileSync('./downloads/voice_message.ogg', Buffer.from(buffer));
  
  await ctx.reply("Voice message saved to server!");
});

```

---

## ☁️ Example 2: Google Apps Script (Saving to Google Drive)

This is where UTF truly shines! If you deployed your bot on Google Apps Script, you have native, authenticated access to Google Drive. You can receive a file from Telegram and upload it directly to your Drive in just a few lines of code.

```typescript
const TOKEN = 'YOUR_TELEGRAM_TOKEN';

bot.on('message:document', async (ctx) => {
  const document = ctx.update.message.document;
  const fileId = document.file_id;
  const fileName = document.file_name || 'telegram_upload.file';
  
  await ctx.replyWithDraft(Date.now(), "Uploading to Google Drive...");

  try {
    // 1. Get the path from Telegram
    const fileInfo = await ctx.api.getFile({ file_id: fileId });
    const downloadUrl = `https://api.telegram.org/file/bot${TOKEN}/${fileInfo.file_path}`;
    
    // 2. Fetch the file using Google's UrlFetchApp
    const response = UrlFetchApp.fetch(downloadUrl);
    
    // 3. Convert the response to a Google Blob
    const blob = response.getBlob().setName(fileName);
    
    // 4. Create the file in Google Drive!
    const driveFile = DriveApp.createFile(blob);
    const driveUrl = driveFile.getUrl();
    
    await ctx.reply(`✅ Successfully saved to Drive!\nLink: ${driveUrl}`);
    
  } catch (error) {
    console.error(error);
    await ctx.reply("Failed to upload the file to Drive.");
  }
});

```

### ⚠️ Important Limitations

* **File Size Limit:** Bots can only download files up to **20 MB** using the standard API.
* **Link Expiration:** The `file_path` returned by `getFile()` is only valid for **1 hour**. You must download the file immediately after requesting the path.