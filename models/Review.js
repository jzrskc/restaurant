const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
  created: {
    type: Date,
    default: Date.now
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author!'
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: 'You must supply a store!'
  },
  text: {
    type: String,
    required: 'Your review must have text!'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  }
});

// ovako izgleda console.log(store.reviews)
// u _review.pug kada bi printali reviews.author, dobili bi ovaj dolje 'id',
// {
//     "_id": "595cdd0e4212d05104c3485f",
//     "text": "Place rocks!",
//     "rating": 5,
//     "author": "59526874440f846539d49e3b",
//     "store": "5954e2b531937a09dc05fcd3",
//     "__v": 0,
//     "created": "2017-07-05T12:35:26.794Z"
//   }

// zato koristimo autopopulate da odemo u drugi Model i dohvatimo "author"

// {
//    "_id": "595cdd0e4212d05104c3485f",
//    "text": "Place rocks!",
//    "rating": 5,
//    "author": {
//      "_id": "59526874440f846539d49e3b",
//      "email": "milan@parcellab.com",
//      "name": "milan",
//      "__v": 0,
//      "hearts": [
//        "5954e24331937a09dc05fcd1",
//        "58c039938060197ca0b52d4d",
//        "5954e2b531937a09dc05fcd3"
//      ]
//    },
//    "store": "5954e2b531937a09dc05fcd3",
//    "__v": 0,
//    "created": "2017-07-05T12:35:26.794Z"
//  },

function autopopulate(next) {
  this.populate('author');
  next();
}
reviewSchema.pre('find', autopopulate);
reviewSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Review', reviewSchema);
