const { MongoClient, ObjectId } = require('mongodb');

console.log(process.env.DATABASE);
const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD,
);

module.exports = {
  addNewDeck: (props, next) => new MongoClient(DB)
    .connect()
    .then((d) => d
      .db('telegram')
      .collection('decks')
      .insertOne(props)
      .then((res) => { d.close(); next(null, res); }))
    .catch((err) => next(err)),
  addNewCard: (props, next) => new MongoClient(DB)
    .connect()
    .then((d) => d
      .db('telegram')
      .collection('cards')
      .insertOne({ deckID: new ObjectId(props.deckID), ...props.card })
      .then((res) => { d.close(); next(null, res); }))
    .catch((err) => next(err)),
  getDecks: (props, next) => new MongoClient(DB)
    .connect()
    .then((d) => {
      d
        .db('telegram')
        .collection('decks')
        .find()
        .toArray()
        .then((res) => { d.close(); next(null, res); })
        .catch((err) => next(err));
    })
    .catch((err) => next(err)),
  getDeck: ({ id, userID }, next) => new MongoClient(DB)
    .connect()
    .then((d) => d
      .db('telegram')
      .collection('decks').aggregate([
        {
          $lookup:
        {
          from: 'cards',
          localField: '_id',
          foreignField: 'deckID',
          as: 'cards',
        },
        },
        { $match: { _id: new ObjectId(id) } }, { $limit: 1 },
      ]).toArray()
      .then((res) => { d.close(); next(null, res[0]); })
      .catch((err) => next(err)))
    .catch((err) => next(err)),
};
