const { Telegraf, Markup } = require('telegraf');
const {
  addNewDeck, getDecks, getDeck, addNewCard, updateCard,
} = require('./config/db');

const bot = new Telegraf(process.env.BOT_TOKEN);
// bot.use(Telegraf.log());
let temp;
let flag;
let cards = [];
const card = {};
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
  checkCard: ({ text, id }, side) => [text, {
    ...Markup.inlineKeyboard([
      Markup.button.callback('☺️ Easy', 'level_1'),
      Markup.button.callback('🙂 Recalled', 'level_2'),
      Markup.button.callback('😮 No idea', 'level_3'),
      Markup.button.callback(`🔄 Show ${side}`, `card_${side}`),
      Markup.button.callback('➕ New Card', `addCard_${id}_front`),
      Markup.button.callback('📝 Edit Card', 'editCard'),
      Markup.button.callback('✏️ Edit Deck', 'editDeck'),
      Markup.button.callback('🔙', 'decks'),
    ], {
      wrap: (_btn, index) => index === 3 || index === 4 || index === 7,
    }),
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
  editCard: () => [
    'What would you like to do?',
    {
      ...Markup.inlineKeyboard(
        [
          Markup.button.callback('✏️ Edit front', 'new deck'),
          Markup.button.callback('✏️ Edit back', 'decks'),
          Markup.button.callback('🗑 Delete', 'decks'),
          Markup.button.callback('🔙', `get_${cards[flag] && cards[flag].deckID}`),
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
bot.action('editCard', (ctx) => {
  console.log(cards[flag].deckID);
  ctx.editMessageText(...keyboard.editCard());
});
bot.action(/level_.+/, (ctx) => updateCard({ _id: cards[flag].deckID, level: ctx.match.input.split('_')[1] }, (err, res) => {
  flag += 1;
  ctx.deleteMessage();

  if (flag >= cards.length) {
    // ctx.editMessageText(cards[flag - 1].front).catch((err) => console.log(err.description));

    ctx.reply('congratulations 🎉');
  } else { ctx.reply(...keyboard.checkCard({ text: cards[flag].front, id: cards[flag].deckID }, 'back')); }

  // getDeck;
}));

// temp = null;
// ctx.editMessageText(...keyboard[ctx.match.input.split('_')[1]]);
bot.action(/card_.+/, (ctx) => {
  const side = ctx.match.input.split('_')[1];
  ctx.editMessageText(...keyboard.checkCard({ text: cards[flag][side], id: cards[flag].deckID }, side === 'front' ? 'back' : 'front'))
    .catch((err) => console.error(err.description));
});
bot.action(/get_.+/, (ctx) => getDeck({ id: ctx.match.input.split('_')[1], userID: ctx.chat.id }, async (err, r) => {
  console.log('hereeee', ctx.match.input, cards[flag]);
  cards = r.cards;
  const { name } = r;
  temp = null;
  ctx.deleteMessage();
  if (err) {
    console.error(err);
  } else if (!cards || !cards.length) {
    ctx.editMessageText(...keyboard.noCards(name, ctx.match.input.split('_')[1]));
  } else {
    temp = 'checkCard';
    flag = 0;
    await ctx.reply(`${cards.length} cards left to rehearse in in* ${name} *`, { parse_mode: 'Markdown' });
    await ctx.reply(...keyboard.checkCard({ text: cards[flag].front, id: cards[flag].deckID }, 'back'));
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
    await ctx.telegram.editMessageText(
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
    if (ctx.message.text === cards[flag].back)ctx.reply('Done ✅'); else {
      ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.message.message_id - 1,
        undefined,
        cards[flag].front,
      );
      await ctx.reply('Wrong ❌');
      await ctx.reply(...keyboard.checkCard({ text: cards[flag].front, id: cards[flag].deckID }, 'back'));
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
