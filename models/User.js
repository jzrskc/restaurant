const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors'); // ljepsi prikaz err poruka
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'invalid Email Address'],
    required: 'Please Supply an email address'
  },
  name: {
    type: String,
    required: 'Please supply a name',
    trim: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  hearts: [
    {type: mongoose.Schema.ObjectId, ref: 'Store'}
  ]
});

// Pravimo gravatar od emaila. On se ne snima u DB. Ako se prijavimo na stranicu i uploadamo nasu sliku bit ce nasa slika
userSchema.virtual('gravatar').get(function() {
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?s=200`;
});

// za Login korstimo email. On postavlja i index na email
userSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
userSchema.plugin(mongodbErrorHandler);


module.exports = mongoose.model('User', userSchema);
