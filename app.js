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





