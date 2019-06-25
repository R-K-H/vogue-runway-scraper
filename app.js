if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const Vogue = require('./vogue.js') 

const show = process.env.SHOW
const rateLimit = process.env.RATE_LIMIT

vogue = new Vogue(show, rateLimit)

vogue.run()