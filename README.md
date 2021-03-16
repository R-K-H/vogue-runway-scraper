# Vogue Fashion Show Image Scraper
This nodejs application takes a parameter and then builds several json files to parse with other functions all in order to download and organize runway show looks. Please note this is working as of last commit date and I may not update it in between, therefore if html elements change then it might break.

- https://www.vogue.com/fashion-shows

## Installation
Simple easy to use node app.

To use this you MUST have node installed on your system. Visit https://nodejs.org/en/ to download and install node.

Once you have node installed, locate the code button on this repository and click clone, be sure you're using HTTPS tab. It should be a url like this.

`https://github.com/R-K-H/vogue-runway-scraper.git`

In your terminal type `git clone https://github.com/R-K-H/vogue-runway-scraper.git`

Once you've cloned the respository change in to that directory using

```
cd vogue-runway-scraper
```

You'll need to install the packages this scraper requires with the following command.

```shell
npm install
```

If using in development environment, copy over the example.env over to .env, you'll use this to set which show. If you're using an editor through terminal:

```shell
cp example.env .env
```

Then open the .env file up using your favorite editor for example:

```
vim .env
```

and set the `RATE_LIMIT`, `NODE_ENV` and `SHOW` environment variables to your desired show. For example:

```
RATE_LIMIT=500
NODE_ENV=development
SHOW=spring-2016-ready-to-wear
```

Note: 1000 ms = 1 second, so the rate limit is setup for miliseconds. If you're noticing issues with requests, try bumping it up, it'll reduce the frequency for the requests and might solve any issues.

Then to run the sofware you can use
```shell
npm start
```

or alternatively

```shell
node app.js
```

If using in a production enviornment:
```shell
RATE_LIMIT=500 SHOW='spring-2016-ready-to-wear' node app.js
```

## Functions

`getShowsList()`

This will get the list of shows from the page and organize it in a JSON file `(./json/shows.json)` with

```json
[
	{
	    "prettyTitle": "A%20D%26%23xE9%3Btacher",
	    "title": "A DETACHER",
	    "link": "https://www.vogue.com/fashion-shows/spring-2019-ready-to-wear/a-detacher",
	    "slug": "a-detacher"
	}, 
]
```

`getAllShowsLooks(collections)`

Once you have the JSON file `(./json/shows.json)` then you are able to fetch all the images from the show which will return another JSON file `(./json/images.json)` with

```json
[
	{
		"atm-anthony-thomas-melillo": 
			[
				"https://assets.vogue.com/photos/5b90541bd80cfc2de0ad06fe/master/pass/00001-atm-vogue-ready-to-wear-SS19-pr.jpg",
			]
	},
]
```

`getLookImages(imageSets)`

Once you have the JSON file `(./json/images.json)` then you are able to fetch each image. The download is called with a promise that builds a chain of promises to ensure one download is complete before the next one is started. This will save files in the `./images/{show}/{designer}` in an interative manner (eg. 1, 2, 3) depending on the order they are received from the JSON response from graphql.


## Future
- Allow user to set folder location
- Research and improve graphql query (might be able to select image size etc)
- Setup unit tests
- Setup compare tests (eg. folders have more images than the look should)
- Compare image look number to what we saved it as (so you wouldn't ever pull a look that isn't the correct number)
- Cleanup (rename files to match functions or vice versa, etc)

## License
This application should be used at your own risk.