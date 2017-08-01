const mongoose = require('mongoose');
mongoose.Promise = global.Promise; // ES6 Promise - wait for data form DB, because it is Sync
const slug = require('slugs'); // User friendly url

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name!'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now()
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply an address!'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an authot'
  }
});

// Define our indexes
storeSchema.index({
  name: 'text',
  description: 'text'
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Define our indexes for geolocation
storeSchema.index({ location: '2dsphere' });



// Prije nego je snimimo, ide ova funkcija. Samo ako je name changed!
// slug mi ne upisivamo, nego uzmemo iz name i uradimo slug i to snimimo- Slug- auto generated
storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // stop this function from running
  }
  this.slug = slug(this.name);
  // slugs needs to be unique!
  // Ako imamo slug wes, napravi wes-1, wes-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i'); //drugi dio regEx je optional
  // Ovako pristupamo DB u schemi
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if(storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
});
// console.log(slug('Hi there! How are you!')); - hi-there-how-are-you

/*
storeSchema.pre('save', function(next) {
  if (!this.isModified('name')) {
    return next();
  }
  this.slug = slug(this.name);
  next();
  // TODO make more resiliant so slugs are unique
});
*/


storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

storeSchema.statics.getTopStores = function() {
  return this.aggregate([
    // Lookup Stores and populate their reviews
    // 'reviews'??? to je 'Review' model kojeg Mongo automatski lowercase & add 's' na kraj
    { $lookup: { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' }},
    // probat u storeController res.json(stores)
    // filter for only items that have 2 or more reviews
    // items that have 2 or more reviews => 'reviews.5'
    { $match: { 'reviews.1': { $exists: true } } },
    // Add the average reviews field
    // $project vraca samo averageRating, zato dodajemo photo: '$$ROOT.photo' - da imamo i te podatke
    // Mongo 3.4 koristo $addField umjesto $project i on rjesava taj problem
    { $project: {
      photo: '$$ROOT.photo',
      name: '$$ROOT.name',
      reviews: '$$ROOT.reviews',
      slug: '$$ROOT.slug',
      averageRating: { $avg: '$reviews.rating' }
    } },
    // sort it by our new field, highest reviews first
    { $sort: { averageRating: -1 }},
    // limit to at most 10
    { $limit: 10 }
  ]);
};

// go to review model and find where the Store '_id' property === Review 'store' property
storeSchema.virtual('reviews', {
  ref: 'Review', // what model to link?
  localField: '_id', // '_id' field on the Store match with...
  foreignField: 'store' // ...match with 'store' field on the Review
});
// ako printamo pre=h.dump(store) i ako se ne vidi review, moramo esplicitno printat store.review

module.exports = mongoose.model('Store', storeSchema);
