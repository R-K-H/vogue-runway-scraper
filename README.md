# Vogue Fashion Show Image Scraper
This nodejs application takes a parameter and then builds several json files to parse with other functions all in order to download and organize runway show looks. 
- https://www.vogue.com/fashion-shows

## Use
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


## Installation
Simple easy to use node app.
```
npm install
```

```
node app.js
```

## Future
- Build it into proper ES(X) with classes and exports etc
- Allow user to pass in param and have it do everything
- Allow user to set folder location
- Set rate limits
- Research and improve graphql query (might be able to select image size etc)
- Setup unit tests
- Setup compare tests (eg. folders have more images than the look should)
- Compare image look number to what we saved it as (so you wouldn't ever pull a look that isn't the correct number)
- Cleanup (rename files to match functions or vice versa, etc)

## License
This application should be used at your own risk.