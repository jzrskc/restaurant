const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' });
}

exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' });
}

// Validation Middleware for Reg User - express-validator
exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.checkBody('email', 'That Email is not valid!').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', 'Password Cannot be Blank!').notEmpty();
  req.checkBody('password-confirm', 'Confirmed Password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Oops! Your passwords do not match').equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    // body: req.body - kada se reloada Forma da se ne pobrisu upisi
    res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
    return; // stop the fn from running
  }
  next(); // there were no errors!
};

// Register user to DB
exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });
  // .register je fn od Passport. Ne moze Async
  const register = promisify(User.register, User);
  await register(user, req.body.password);  // od password pravimo Hash
  // res.send('It works!!')
  next(); // pass to authController.login
};


// User account
exports.account = (req, res) => {
  res.render('account', { title: 'Edit Your Account'});
};

exports.updateAccount = async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email
  };
  // findOneAndUpdate the user - 1. Query 2. Data 3. Options
  const user = await User.findOneAndUpdate({ _id: req.user._id }, { $set: updates}, {
    new: true, // return the new user instead of the old one
    runValidators: true,
    context: 'query'
  });

  req.flash('success', 'Updated the profile!')
  res.redirect('back');
};
