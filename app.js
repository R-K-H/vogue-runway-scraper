const dotenv = require("dotenv");
const https = require('https')
const fs = require('fs')
const _ = require('lodash')
const { join } = require('path')
const Xray = require('x-ray')

// Settings for app scraping
const show = 'spring-2019-ready-to-wear' // TODO: Make me an env var or better yet make me able to be an array?
const directory = __dirname + '/images/' + show // TODO: Cleanup not sure this needs to be here.

// Bring in the files
const collections = require('./json/shows.json')
const lookCount = require('./json/look-counts.json')
const folderCount = require('./json/folder-counts.json')
const imageSets = require('./json/images.json')


const x = Xray({filters: {
    encodeUri: function (value) {
		return typeof value === 'string' ? encodeURIComponent(value) : value
    },
    stripSlug: function(value) {
    	var regex = /(?=[^\/]+$)(.*)/
    	return typeof value === 'string' ? regex.exec(value)[0] : value
    },
    formatSlug: function(value) {
    	return typeof value === 'string' ? value.toUpperCase().replace(/(-+)/g, ' ') : value
    },
    countToInt: function(value) {
    	return typeof value === 'string' ? parseInt(value) : value
    }
}})

const isDirectory = source => fs.lstatSync(source).isDirectory()

// This fetches from the page the total number of looks in the show for the season
// TODO: We should really use this count to enforce the number of images we want to retrieve
// from the graphql.
const getShowLookCount = (collections) => {
	_.forEach(collections, function(collection) {
			let collectionTitle = collection.title
			let content = "";  
			let req = https.get(collection.link, function(res) {
			    res.setEncoding("utf8");
			    res.on("data", function (chunk) {
			        content += chunk;
			    });

			    res.on("end", function () {
			        x(content, '.gallery-marker--count@html | countToInt')(function(err, obj){
							let collect = {}
							collect[collectionTitle] = obj
							fs.appendFile('look-counts.json', JSON.stringify(collect) + ',\n', function (err) {
							  if (err) throw err;
							  console.log('Saved!');
							});
						})
			    });
			});

			req.end();
		})
}

// Simple function to count the number of images we have in each folder
// to compare with the look count to make sure we didn't do anything wrong.
// TODO: See TODO
const getShowFolderImageCount = (source) => {
	let directories = fs.readdirSync(source).map(name => join(source, name)).filter(isDirectory)
	let results = []
	_.forEach(directories, (directory) => {
		let obj = {}
		fs.readdir(directory, (err, files) => {
			let name = directory.replace(source + '/', '')
			obj[name] = files.length
			let cleanObj = JSON.stringify(obj)
			// TODO: Format this in an array for us to compare to the look count
			console.log(cleanObj)
		})
	})
}

// Build list of all the shows with their vogue url as well as their titles
const getShowsList = () => {
	x('https://www.vogue.com/fashion-shows/' + show, 
		'.season-module li .tab-list--item', [
			{
				prettyTitle: 'a@html | encodeUri',
				title: 'a@href | stripSlug | formatSlug',
				link: 'a@href',
				slug: 'a@href | stripSlug'
			}
		]
	)
	.write('shows.json')
}

// This gets all the looks for each show by iterating though the getShowImagesUrl which writes it to a JSON file
const getAllShowsLooks = (collections) => {
	let slugs = []
	_.forEach(collections, function(collection) {
		slugs.push(collection.slug)
	})
	sortedSlugs = slugs.sort()
	for(i = 0; i < sortedSlugs.length; i++) {
		getShowImagesUrl(sortedSlugs[i], 200)
	}
}

// This uses vogues graphql to get a list from the shows using the slug and a modified count (to fetch them all)
// TODO: Look into their actual graphql to see if we could simplify this and retrieve what we want to in a more ordered fashion vs
// their user for slideshows.
const getShowImagesUrl = (slug, count) => {
	let query = '/graphql?query=query%20SlideshowPortraitPageRelayPaginationQuery($brandSlug:String!%20$count:Int!%20$cursor:String%20$galleryType:FashionGalleryTypeEnum!%20$hierarchy:String%20$seasonSlug:String!%20$slug:String){...SlideshowPortraitPageRelay}fragment%20SlideshowPortraitPageRelay%20on%20Root{...SiteContainerRelay%20...EndSlideRelay_data%20...SwipeSlideshowRelay_data%20fashionShow:fashionShowV2(slug:$slug){...RunwaySlideshowHeaderRelay_fashionShow%20photosTout{__typename%20...%20on%20Image{url%20id}...%20on%20Video{id}...%20on%20Clip{id}}...SlideshowTitleRelay_fashionShow%20...EndSlideRelay_fashionShow%20...SwipeSlideshowRelay_fashionShow%20...SocialSharerRelay%20...BaseHelmetRelay%20url%20brand{slug%20id}season{slug%20id}galleries{collection{id}atmosphere{id}beauty{id}detail{id}frontRow{id}}id}fashionGallery:fashionGalleryByType(brandSlug:$brandSlug,seasonSlug:$seasonSlug,galleryType:$galleryType){...SlideshowAdColumnRelay_fashionGallery%20...SocialSharerRelay%20slideCount%20slidesV2(after:$cursor,first:$count){edges{node{__typename%20...%20on%20SlideInterface{...GridViewRelay_slides%20caption%20credit%20id%20photosTout{__typename%20...%20on%20Image{url%20id}...%20on%20Video{id}...%20on%20Clip{id}}}...%20on%20CollectionSlide{details{...%20on%20Slide{photosTout{__typename%20...%20on%20Image{url%20id}...%20on%20Video{id}...%20on%20Clip{id}}}id}modaLink%20moveItVideo%20id}...%20on%20Slide{id}}cursor}pageInfo{endCursor%20hasNextPage}}id}}fragment%20SiteContainerRelay%20on%20Root{...FeedHeaderRelay%20...SiteHeaderRelay}fragment%20EndSlideRelay_data%20on%20Root{allContent(first:10,type:[%22FashionShowV2%22]){edges{node{__typename%20...%20on%20FashionShowV2{id%20url%20brand{name%20id}season{name%20id}galleries{atmosphere{photosTout{__typename%20...%20on%20Image{altText%20url%20id}...%20on%20Video{id}...%20on%20Clip{id}}id}beauty{photosTout{__typename%20...%20on%20Image{altText%20url%20id}...%20on%20Video{id}...%20on%20Clip{id}}id}collection{photosTout{__typename%20...%20on%20Image{altText%20url%20id}...%20on%20Video{id}...%20on%20Clip{id}}id}detail{photosTout{__typename%20...%20on%20Image{altText%20url%20id}...%20on%20Video{id}...%20on%20Clip{id}}id}frontRow{photosTout{__typename%20...%20on%20Image{altText%20url%20id}...%20on%20Video{id}...%20on%20Clip{id}}id}}}id}}}}fragment%20SwipeSlideshowRelay_data%20on%20Root{...EndSlideRelay_data}fragment%20RunwaySlideshowHeaderRelay_fashionShow%20on%20FashionShowV2{...SlideshowTitleRelay_fashionShow}fragment%20SlideshowTitleRelay_fashionShow%20on%20FashionShowV2{brand{name%20url%20id}season{name%20url%20id}}fragment%20EndSlideRelay_fashionShow%20on%20FashionShowV2{...SlideshowTitleRelay_fashionShow%20...SocialSharerRelay%20season{name%20url%20id}}fragment%20SwipeSlideshowRelay_fashionShow%20on%20FashionShowV2{...EndSlideRelay_fashionShow%20brand{slug%20id}}fragment%20SocialSharerRelay%20on%20Content{__typename%20id%20title%20url%20photosTout{__typename%20...%20on%20Image{url%20id}...%20on%20MixedMedia{default{__typename%20...%20on%20Image{title%20url}id}}...%20on%20Video{id}...%20on%20Clip{id}}GMTPubDate%20GMTModDate%20meta{facebook{title%20description%20imageURL}seo{title%20description%20keywords}twitter{title%20description%20imageURL}}}fragment%20BaseHelmetRelay%20on%20Content{...%20on%20FashionShowV2{reviewContributors:review{contributor{artist{name%20id}author{name%20id}editor{name%20id}photographer{name%20id}videographer{name%20id}}id}}GMTPubDate%20GMTModDate%20channels{id%20name}channel{id%20name%20parent{id%20name}}tags{id%20name}contributor{artist{name%20id}author{name%20id}editor{name%20id}photographer{name%20id}videographer{name%20id}}meta{facebook{title%20description%20imageURL}seo{title%20description%20keywords}twitter{title%20description%20imageURL}}}fragment%20SlideshowAdColumnRelay_fashionGallery%20on%20FashionShowGallery{...SocialSharerRelay}fragment%20GridViewRelay_slides%20on%20SlideInterface{photosTout{__typename%20...%20on%20Image{url%20id}...%20on%20Video{id}...%20on%20Clip{id}}}fragment%20FeedHeaderRelay%20on%20Root{headerTerm:term(hierarchy:$hierarchy){...TermSocialSharerRelay%20name%20description%20pageHeader{colorScheme%20bannerLink%20bannerLinkTitle%20bannerImage}parent{name%20pageHeader{colorScheme%20bannerLink%20bannerLinkTitle%20bannerImage}id}id}}fragment%20SiteHeaderRelay%20on%20Root{allSeasons(first:10){edges{node{id%20name%20url}}}}fragment%20TermSocialSharerRelay%20on%20Term{name%20url%20meta{seo{title%20description%20keywords}}}&variables='

	let vars = '{%22brandSlug%22:%22' + slug + '%22,%22count%22:'+ count +',%22galleryType%22:%22collection%22,%22hierarchy%22:null,%22seasonSlug%22:%22spring-2019-ready-to-wear%22,%22slug%22:null}'

	let fullQuery = query + vars
	var options = {
	  host: 'graphql.vogue.com',
	  path: fullQuery
	};
	let content = "";  
	let req = https.request(options, function(res) {
	    res.setEncoding("utf8");
	    res.on("data", function (chunk) {
	        content += chunk;
	    });

	    res.on("end", function () {
	    	let obj = JSON.parse(content)
	    	if(obj.data.hasOwnProperty('fashionGallery') && obj.data.fashionGallery != null) {
		    	//console.log(obj.data)
		    	let images = obj.data.fashionGallery.slidesV2.edges
		    	let imageArry = []
		    	_.forEach(images, function(image) {
		    		imageArry.push(image.node.photosTout.url)
		    	})
		    	let newOb = {}
		    	newOb[slug] = imageArry
		    	fs.appendFile('images.json', JSON.stringify(newOb) + ',\n', function (err) {
				  if (err) {
				  	console.log(err)
				  }
				  console.log('Saved!');
				});
			}
	    })
	})
	req.end()
}

// This makes a request to fetch the images it does a check to see if the folder already exists
// and if it does if the image exists and it's of the same size, if not it creates the folder, and 
// saves the image.
const downloadImage = (options) => {
	return new Promise(function(resolve, reject) {
		var uri = options.uri
		var dir = options.dir
		var filename = options.filename
		let fileSizeInBytes = 0
		if (!fs.existsSync(dir)){
		    fs.mkdirSync(dir);
		}
		if (fs.existsSync(dir + filename)) {
			let stats = fs.statSync(dir + filename)
			fileSizeInBytes = stats.size
		}

		request.get(uri)
		.on('error', function(err) {
		    console.log(err)
		    reject(err)
		})
		.on('response', function(response) {
		    if(fileSizeInBytes == response.headers['content-length']) {
		    	console.log(filename)
		    	console.log('content-length: ' + response.headers['content-length'] + '/' + fileSizeInBytes)
		    	resolve(true)
		    } else {
		    	console.log('Downloading ' + filename + ' with a size of ' + (response.headers['content-length'] / 1000000) + 'MB' )
		    	response.pipe(fs.createWriteStream(dir + filename))
				.on('close', function() {
				    resolve(true)
				})
		    }
		})
	})
}

// This is what gets the images from the JSON file, it creates an array of
// promises in order to ensure each image is downloaded before the next one starts
// so as not to a) kill your internet connection (show for 2019-spring was ~20GB)
// and b) not to upset vogue with too many requests.
const getLookImages = (imageSets) => {
	var p = Promise.resolve();
	_.forEach(imageSets, function(set) {
		var i = 0;
		_.forEach(_.values(set)[0], function(image) {
				i ++
				var url = image
				var designer = _.keys(set)[0].toUpperCase().replace(/(-+)/g, ' ')
				// Download to a directory and save with the original filename
				const options = {
				  uri: url,
				  dir: __dirname + '/images/' + show + '/' + designer + '/',
				  filename:  designer + ' ' + i + '.jpg'         // Save to /path/to/dest/image.jpg
				}
				p = p.then(downloadImage.bind(null, options));
		})
	})
	p.then(_ => console.log('done'));
}
// getShowFolderImageCount(directory)
// getShowLookCount(collections)
// getAllShowsLooks(collections)
// getShowImagesUrl('christopher-esber', 40)
// getShowsList()
// getLookImages()