const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer'); // photo upload
const jimp = require('jimp'); // resize img
const uuid = require('uuid'); // unique id identifier - da ne budu 2 slike istog imena

// Opcije za upload fajla. 1 save in memory; 2 mora biti slika
const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if(isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That filetype isn\'t allowed!' }, false);
    }
  }
};

exports.upload = multer(multerOptions).single('photo');

// Resize
exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    next(); // skip to the next middleware
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  next();
};
// KRAJ UPLOAD FILE //


exports.homePage = (req, res) => {
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};


exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  // const store = await (new Store(req.body)).save(); // short version
  const store = new Store(req.body);
  await store.save(); // Nece ici dalje, dok ne snimi
  req.flash('success', `Successfuly created ${store.name}. Leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

// store.save(function(err, store) {
//   if(!err) {
//     console.log('Saved');
//     res.redirect('/');
//   }
// });

// 1. Query the database for a list of all stores - pagination
exports.getStores = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 4;
  const skip = (page * limit) - limit;

  const storesPromise = Store
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' })
    .populate('reviews');
  // localhost:3000/stores/page/1

  // Treba nam broj Stores, da znamo kada smo dosli do kraja
  const countPromise = Store.count();

  const [ stores, count ] = await Promise.all([storesPromise, countPromise]);

  // Br stranica
  const pages = Math.ceil(count / limit);

  if (!stores.length && skip) {
    req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
    res.redirect(`/stores/page/${pages}`);
    return;
  }

  res.render('stores', { title: 'Stores', stores, page, pages, count });
};


// Edit Store
exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id });

  // confirm that they are owner of the store
  if(!store.author.equals(req.user.id)) {
    throw Error('You must own a store in order to edit it!');
  };
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

// Uodate Store
exports.updateStore = async (req, res) => {
  // Kada updejtamo point, on postane Array, ovo je da bude Point
  req.body.location.type = 'Point';
  // findOneAndUpdate the store - 1. Query 2. Data 3. Options
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new store instead of the old one
    runValidators: true
  }).exec();
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/store/${store.slug}">View Store →</a>`);
  res.redirect(`/stores/${store._id}/edit`);
};

// Get Single Store
exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews');
  // ako nema toga u DB, tj ako je URL netocan vrati err 404
  console.log(store);
  if (!store) return next();
  res.render('store', { store, title: store.name });
};

// Get Tags
exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  // izlistaj nam ili samo taj tag ili sve
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList(); // models/Store
  const storesPromise = Store.find({ tags: tagQuery });
  // Na ovaj nacin rjesavamo vise Promise. Bez ovoga nema rezultata
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  // res.json(tags);
  res.render('tag', { tags, tag, title: 'Tags', stores });
};


/*
API Search
*/
exports.searchStores = async (req, res) => {
  // http://localhost:3000/api/search?q=beer
  // 1.find stores that match
  // 2. score - veci score ima onaj store u kojem se vise puta ponavlja trazena rijec
  // 3. Sort i Limit
  const stores = await Store.find({
    $text: {
      $search: req.query.q,
    }
  }, {
    score: { $meta: 'textScore' }
  }).sort({
    score: { $meta: 'textScore' }
  }).limit(5);

  res.json(stores)
};

// Find Stores in range of 10km
exports.mapStores = async (req, res) => {
  // http://localhost:3000/api/stores/near?lat=43.2&lng=-79.8
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 // 10km
      }
    }
  };

  // .select() - koja polja zelimo poslati API-u, koja ne zelimo dodamo "-" (-slug)
  const stores = await Store.find(q).select('slug name description location photo').limit(10);
  res.json(stores);
};

// Display Stores in a Map
exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};


// post HEART
exports.heartStore = async (req, res) => {
  // Ovo radimo jer hearts - array objekta [{}, {}, {}]
  const hearts = req.user.hearts.map(obj => obj.toString());
  // pull- delete from db; addToSet- dodaj u db. razl izmedu addToSet i push je sto addToSet nece dodat ako vec postoji, mora biti unique
  // { $pull: { hearts: req.params.id }} - ovo bi dolje koristili, da treba samo pull napravit
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User.findByIdAndUpdate(req.user._id,
    { [operator]: { hearts: req.params.id }},
    { new: true }
  );
  res.json(user);
};

// Get HEARTS
exports.getHearts = async (req, res) => {
  const stores = await Store.find({
    _id: { $in: req.user.hearts }
  });
  res.render('stores', { title: 'Hearted Stores', stores });
};


// Get getTopStores
exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  // res.json(stores);
  res.render('topStores', { stores, title:'⭐ Top Stores!'});
};
