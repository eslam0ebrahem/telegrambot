const { Telegraf, Markup } = require('telegraf');
const {
  addNewDeck, getDecks, getDeck, addNewCard,
} = require('./config/db');

const bot = new Telegraf(process.env.BOT_TOKEN);
// bot.use(Telegraf.log());
let temp;
let card = {};
const keyboard = {
  menu: [
    'Menu',
    {
      ...Markup.inlineKeyboard(
        [
          Markup.button.callback('New Deck', 'new deck'),
          Markup.button.callback('Deck List', 'decks'),
        ],
        { wrap: () => 1 },
      ),
    },
  ],
  noCards: (name, id) => [`You currently have no cards in* ${name} *`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard(
      [
        Markup.button.callback('➕ New Card', `addCard_${id}_front`),
        Markup.button.callback('🔙', 'decks'),

      ],
      { wrap: () => 1 },
    ),
  }],
  checkCard: (data, side) => [data, {
    ...Markup.inlineKeyboard([
      Markup.button.callback('☺️ Easy', 'level_1'),
      Markup.button.callback('🙂 Recalled', 'level_2'),
      Markup.button.callback('😮 No idea', 'level_3'),
      Markup.button.callback(`🔄 Show ${side}`, `card_${side}`),
    ], { wrap: (btn, index, currentRow) => currentRow.length >= (index + 3) / 2 }),
  }],
  Not: [
    'not',
    {
      ...Markup.inlineKeyboard(
        [
          Markup.button.callback('New Deck', 'new deck'),
          Markup.button.callback('🔙', 'back_menu'),
        ],
        { wrap: () => 1 },
      ),
    },
  ],
};
bot.start((ctx) => ctx.reply('Welcome'));
bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.command('menu', (ctx) => ctx.reply(...keyboard.menu));
bot.action(/back_.+/, (ctx) => {
  temp = null;
  ctx.editMessageText(...keyboard[ctx.match.input.split('_')[1]]);
});
bot.action(/card_.+/, (ctx) => {
  const side = ctx.match.input.split('_')[1];
  ctx.editMessageText(...keyboard.checkCard(card[side], side === 'front' ? 'back' : 'front'))
    .catch((err) => console.error(err.description));
});
bot.action(/get_.+/, (ctx) => getDeck({ id: ctx.match.input.split('_')[1], userID: ctx.chat.id }, async (err, r) => {
  const { cards, name } = r;
  temp = null;
  if (err) {
    console.error(err);
  } else if (!cards || !cards.length) {
    ctx.editMessageText(...keyboard.noCards(name, ctx.match.input.split('_')[1]));
  } else {
    temp = 'checkCard';
    [card] = cards;
    await ctx.reply(`${cards.length}/${cards.length} cards left to rehearse in in* ${name} *`, { parse_mode: 'Markdown' });
    await ctx.reply(...keyboard.checkCard(card.front, 'back'));
  }
}));
bot.action('decks', (ctx) => getDecks(null, (err, res) => {
  temp = null;
  if (err) {
    console.error(err);
  } else {
    ctx
      .editMessageText('Select the deck you want to work on.', {
        ...Markup.inlineKeyboard([
          ...res.map(({ name, _id }) => Markup.button.callback(name, `get_${_id}`)),
          Markup.button.callback('🔙', 'back_menu'),
        ], {
          wrap: () => 1,
        }),
      })
      .catch((err) => console.log(err.description));
  }
}));
bot.action(/addCard_.+/, (ctx) => {
  temp = ctx.match.input;
  ctx.editMessageText('Please send a message to use for the front.', {
    ...Markup.inlineKeyboard([Markup.button.callback('🔙', `get_${ctx.match.input.split('_')[1]}`)]),
  });
});
bot.action('new deck', (ctx) => {
  temp = 'new deck';
  ctx.editMessageText("What's the name of the new deck?", {
    ...Markup.inlineKeyboard([Markup.button.callback('🔙', 'back_menu')]),
  });
});
bot.on(['text', 'photo'], async (ctx) => {
  // addNewDeck(Telegraf.log());
  // ctx.reply(Telegraf.log());
  // ctx.forwardMessage(ctx.chat.id, ctx.message.message_id-1);
  if (temp === 'new deck') {
    ctx.telegram.editMessageText(
      ctx.chat.id,
      ctx.message.message_id - 1,
      undefined,
      "What's the name of the new deck?",
    );
    addNewDeck({ name: ctx.message.text, userID: ctx.chat.id }, async (err) => {
      if (err) {
        console.error(err);
      } else {
        await ctx.reply('Done ✅', { reply_to_message_id: ctx.message.message_id });
        await ctx.reply(...keyboard.menu);
      }
    });
  } else if (/addCard_.+/.test(temp)) {
    const actionData = temp.split('_');
    ctx.telegram.editMessageText(
      ctx.chat.id,
      ctx.message.message_id - 1,
      undefined,
      `Please send a message to use for the ${actionData[2]}.`,
    );
    // ctx.reply('Done ✅', { reply_to_message_id: ctx.message.message_id });
    card[actionData[2]] = ctx.message.text;
    if (actionData[2] === 'front') {
      ctx.reply('Please send a message to use for the back.', {
        ...Markup.inlineKeyboard([Markup.button.callback('🔙', 'back_menu')]),
      });
      temp = `addCard_${actionData[1]}_back`; return;
    }
    addNewCard({ deckID: actionData[1], card }, async (err, res) => {
      if (err) {
        console.error(err);
      } else {
        // console.error(res);

        await ctx.reply('Done ✅');
        await ctx.reply(...keyboard.menu);
      }
    });
  } else if (temp === 'checkCard') {
    if (ctx.message.text === card.back)ctx.reply('Done ✅'); else {
      await ctx.reply('Wrong ❌');
      await ctx.reply(card.front);

      return;
    }
  }
  temp = null;
});
bot.hears('hi', (ctx) => ctx.reply('Hey there'));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
module.exports = bot;
