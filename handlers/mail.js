const nodemailer = require('nodemailer');
const pug = require('pug'); // pug to HTML
const juice = require('juice'); // inline CSS za starije mail preglednike
const htmlToText = require('html-to-text'); // Za email
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});
// vec sada mozemo slati email
// Moramo ovo negdje importat (start.js) require('./handlers/mail');
// transport.sendMail({
//   from: `Wes Bos <noreply@wesbos.com>`,
//   to: 'randy@gmail.com',
//   subject: 'Just trying things out!',
//   html: 'Hey I <strong>Love</strong> you!',
//   text: 'Hey I **Love** you!'
// })

// views/email - saljemo PUG mail
const generateHTML = (filename, options = {}) => {
  // __dirname - current directory, to je dobro jer ne znamo gdje ce biti fileovi na serveru
  // u .pug su prosljedene OPTIONS
  const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
  const inlined = juice(html);
  return inlined;
};

// Postavke za slanje Reset Password
// Ovo ide u authController, umjesto flash poruke ide mail
exports.send = async (options) => {
  const html = generateHTML(options.filename, options);
  const text = htmlToText.fromString(html);

  const mailOptions = {
    from: `Wes Bos <noreply@wesbos.com>`,
    to: options.user.email,
    subject: options.subject,
    html,
    text
  };
  const sendMail = promisify(transport.sendMail, transport);
  return sendMail(mailOptions);
};
