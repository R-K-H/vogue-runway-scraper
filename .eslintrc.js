module.exports = {
	extends: ['standard'],
	plugins: ['standard'],
	rules: {
		'no-var': 'error', // optional, recommended when using es6+
		'no-unused-vars': 1, // recommended
		'arrow-spacing': ['error', { before: true, after: true }], // recommended
		indent: ['error', 2],
		'no-tabs': 0,
		'comma-dangle': [
			'error',
			{
				objects: 'only-multiline',
				arrays: 'only-multiline',
				imports: 'never',
				exports: 'never',
				functions: 'never'
			}
		],

		// options to emulate prettier setup
		semi: ['error', 'never'],
		'max-len': ['warn', { code: 120, ignoreUrls: true, ignoreStrings: true }],
		'template-curly-spacing': ['error', 'always'],
		'arrow-parens': ['error', 'as-needed'],

		// standard.js
		'space-before-function-paren': [
			'error',
			{
				named: 'always',
				anonymous: 'always',
				asyncArrow: 'always'
			}
		],

		// standard plugin - options
		'standard/object-curly-even-spacing': ['error', 'either'],
		'standard/array-bracket-even-spacing': ['error', 'either'],
		'standard/computed-property-even-spacing': ['error', 'even'],
		'standard/no-callback-literal': ['error', ['cb', 'callback']],
	},
	parser: 'babel-eslint',
	parserOptions: {
		ecmaVersion: 8 // optional, recommended 6+
	}
}
