const { Markup } = require('telegraf');

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
  editCard: (card) => [
    'What would you like to do?',
    {
      ...Markup.inlineKeyboard(
        [
          Markup.button.callback('✏️ Edit front', 'edit_front'),
          Markup.button.callback('✏️ Edit back', 'edit_back'),
          Markup.button.callback('🗑 Delete', 'deleteCard'),
          Markup.button.callback('🔙', `get_${card && card.deckID}`),
        ],
        { wrap: () => 1 },
      ),
    },
  ],
  editDeck: (card) => [
    'What would you like to do?',
    {
      ...Markup.inlineKeyboard(
        [
          Markup.button.callback('✏️ Edit name', 'deck_edit'),
          Markup.button.callback('🗑 Delete', 'deck_delete'),
          Markup.button.callback('🔙', `get_${card && card.deckID}`),
        ],
        { wrap: () => 1 },
      ),
    },
  ],
};
exports.keyboard = keyboard;
