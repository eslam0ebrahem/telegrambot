const { Telegraf } = require('telegraf');
const app = require('./app');

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
    domain: 'https://lime-vivacious-bison.cyclic.app/',
    port: port,
  },
});

app.listen(port, () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://localhost:${port}`);
  /* eslint-enable no-console */
});
