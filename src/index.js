// const app = require('./app');
require('dotenv').config();
const bot = require('./bot');

const port = process.env.PORT || 5000;
// bot.launch();
bot.launch({
  webhook: {
    domain: 'telegrambot-oqbvga.codecapsules.co.za',
    port,
  },
});
// app.listen(port, () => {
//   /* eslint-disable no-console */
//   console.log(`Listening: http://localhost:${port}`);
//   /* eslint-enable no-console */
// });
