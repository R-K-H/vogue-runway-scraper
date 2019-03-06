const dotenv = require("dotenv");
const Vogue = require('./vogue.js') 

const show = 'spring-2019-ready-to-wear' // TODO: Make me an env var or better yet make me able to be an array?

vogue = new Vogue(show)

vogue.run()