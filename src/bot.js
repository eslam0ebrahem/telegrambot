const { Telegraf, Markup } = require('telegraf');
const {
  addNewDeck, getDecks, getDeck, addNewCard, updateCard, deleteCard, editCard, editDeck,
} = require('./config/db');
const { keyboard } = require('./keyboard');

const bot = new Telegraf(process.env.BOT_TOKEN);
// bot.use(Telegraf.log());
let temp; let flag;
let cards = [];
const card = {};
bot.start((ctx) => ctx.reply('Welcome'));
bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.command('menu', (ctx) => ctx.reply(...keyboard.menu));
bot.action(/back_.+/, (ctx) => {
  temp = null;
  ctx.editMessageText(...keyboard[ctx.match.input.split('_')[1]]);
});
bot.action(/edit_.+/, (ctx) => {
  temp = ctx.match.input;
  ctx.editMessageText(`Please send a message to use for the ${ctx.match.input.split('_')[1]}.`, {
    ...Markup.inlineKeyboard([Markup.button.callback('🔙', 'editCard')]),
  });
});

bot.action(/deck_.+/, (ctx) => {
  const action = ctx.match.input.split('_')[1];
  if (action === 'edit') {
    temp = ctx.match.input;
    ctx.editMessageText('Please send a message to update the deck name.', {
      ...Markup.inlineKeyboard([Markup.button.callback('🔙', 'editDeck')]),
    });
  }
});
bot.action('editCard', (ctx) => {
  temp = null;
  ctx.editMessageText(...keyboard.editCard(cards[flag]));
});
bot.action('editDeck', (ctx) => {
  temp = null;
  ctx.editMessageText(...keyboard.editDeck(cards[flag]));
});
bot.action('deleteCard', (ctx) => deleteCard(cards[flag]._id, (err, res) => {
  if (err)console.error(err);
  ctx.editMessageText('Card has been deleted');
}));
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
  } else if (/edit_.+/.test(temp)) {
    const side = temp.split('_')[1];
    ctx.telegram.editMessageText(
      ctx.chat.id,
      ctx.message.message_id - 1,
      undefined,
      `Please send a message to use for the ${side}.`,
    );
    // console.log(cards, flag, card, side);
    editCard({ _id: cards[flag]._id, side, text: ctx.message.text }, async (err) => {
      if (err)console.error(err);
      else {
        await ctx.reply('Done ✅', { reply_to_message_id: ctx.message.message_id });
        await ctx.reply(...keyboard.menu);
      }
    });
  } else if (temp === 'deck_edit') {
    const side = temp.split('_')[1];
    ctx.telegram.editMessageText(
      ctx.chat.id,
      ctx.message.message_id - 1,
      undefined,
      'Please send a message to update the deck name.',
    );
    // console.log(cards, flag, card, side);
    editDeck({ _id: cards[flag].deckID, name: ctx.message.text }, async (err) => {
      if (err)console.error(err);
      else {
        await ctx.reply('Done ✅', { reply_to_message_id: ctx.message.message_id });
        await ctx.reply(...keyboard.menu);
      }
    });
  }
  temp = null;
});
bot.hears('hi', (ctx) => ctx.reply('Hey there'));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
module.exports = bot;
