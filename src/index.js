const { Telegraf } = require('telegraf');

const port = process.env.PORT || 5000;

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) => ctx.reply('Welcome'));
bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.on('text', (ctx) => {
  ctx.reply('👍');
});
bot.hears('hi', (ctx) => ctx.reply('Hey there'));
bot.launch({
  webhook: {
    domain: 'telegrambot-oqbvga.codecapsules.co.za',
    port,
  },
});
