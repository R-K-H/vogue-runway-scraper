if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const Vogue = require('./vogue.js')

const show = process.env.SHOW // Replace if no env
const rateLimit = process.env.RATE_LIMIT // Replace if no env

const vogue = new Vogue(show, rateLimit)

vogue.run()
