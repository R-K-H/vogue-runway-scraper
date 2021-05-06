const prompts = require('prompts')
const Vogue = require('./vogue.js')

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

try {
	const show = process.env.SHOW // Replace if no env
	const rateLimit = process.env.RATE_LIMIT // Replace if no env
	const designer = process.env.DESIGNER
} catch (error) {
	console.log(error)
}



(async () => {
	console.log(`Welcome to Vogue Runway Scraper`)
	console.log(`v2.0.0`)
	console.log(``)
	console.log(`Visit https://github.com/R-K-H/vogue-runway-scraper if you experience any issues.`)
	console.log(``)
	console.log(`If you are getting timed out or experiencing issues with downloads, try increasing the rate limit.`)
	console.log(`There may be bugs! If you notice anything or have a feature request please email kollanh@gmail.com.`)
	console.log(``)
	console.log(`This program fetches from Vogue's GraphQL API for designers (brands) and seasons, it's been adapted to`)
	console.log(`fetch and download all the images for each season and or brand season.`)
	console.log(``)
	console.log(`Respond to the questions below and things should get to work.`)
	console.log(``)
	console.log(``)
	console.log(``)
	console.log(``)

	const questions = [
		{
			type: 'text',
	    	name: 'designerBool',
	    	message: 'Are you interested in adding only a designer to your collection? (yes or no)',
		},
		{
			type: prev => prev.toLowerCase() == 'yes' ? 'text' : null,
			name: 'designer',
			message: 'Which designer would you like to collect? (lowercase with hypens)'
		},
		{
			type: prev => prev == 'no' ? 'text' : null,
	    	name: 'season',
	    	message: 'Which season would you like to add to your collection? (lowercase with hypens)',
		},
		
		{
			type: 'number',
	    	name: 'rateLimit',
	    	message: 'What would you like your rate limit to be? (in milliseconds)',
		},
	]
	const onSubmit = (prompt, answer) => console.log(`Thanks I got ${answer} from ${prompt.name}`);
	const response = await prompts(questions, { onSubmit });
	let _designer = null
	let _season = null
	if (response.designerBool.toLowerCase() != 'no' && response.hasOwnProperty('designer')) {
		_designer = response.designer
	} else {
		_season = response.season
	}
	let _rateLimit = response.rateLimit
	const vogue = new Vogue(_rateLimit, _season, _designer)
	vogue.run()
})();





