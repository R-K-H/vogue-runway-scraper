const dotenv = require("dotenv");
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const http = require('http')
const https = require('https')
const fs = require('fs')
//const Path = require("path")
const _ = require('lodash')
const collections = require('./shows.json');
//const collections = null

const show = 'spring-2019-ready-to-wear'
// Bring in all files for scraping
const newImageSets = require('./images.json')

const Xray = require('x-ray');
const x = Xray({filters: {
    trim: function (value) {
      return JSON.parse(value)
    }
}});

const getLookCount = () => {
	_.forEach(collections, function(collection) {
			let collectionTitle = collection.title
			let link = 'www.vogue.com' 
			let path = collection.link.replace('https://'+link, '')
			var options = {
			  host: link,
			  path: path
			};
			let content = "";  
			let req = https.request(options, function(res) {
			    res.setEncoding("utf8");
			    res.on("data", function (chunk) {
			        content += chunk;
			    });

			    res.on("end", function () {
			        x(content, 
						'.gallery-marker--count@html')(function(err, obj){
							let string = JSON.stringify(obj)
							let collect = {}
							let thing = string.replace(/\n/g, ' ');
							collect[collectionTitle] = thing
							
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

const getShows = () => {
	if(_.isEmpty(collections)){
		// Build list of pages we want to scrape
		x('https://www.vogue.com/fashion-shows/spring-2019-ready-to-wear', 
			'.season-module li .tab-list--item', [
				{
				  title: 'a@html',
				  link: 'a@href'
				}
			]
		)
		.write('shows.json')
	} else {
		var p = Promise.resolve();
		_.forEach(collections, function(collection) {
			p = p.then(getPage.bind(null, collection));
		})
		p.then(_ => console.log('done'));
	}
}

const getShowSlugs = () => {
	var regex = /(?=[^\/]+$)(.*)/
	let slugs = []
	_.forEach(collections, function(collection) {
		slugs.push(regex.exec(collection.link)[0])
	})
	sortedSlugs = slugs.sort()
	for(i = 0; i < sortedSlugs.length; i++) {
		getShowImages(sortedSlugs[i], 200)
	}
}

const getShowImages = (slug, count) => {
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

const download = (options) => {
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

const getImages = () => {
	var p = Promise.resolve();
	_.forEach(newImageSets, async function(set) {
		var i = 0;
		_.forEach(_.values(set)[0], async function(image) {
				i ++
				var url = image

				var designer = _.keys(set)[0].toUpperCase().replace(/(-+)/g, ' ')
				// Download to a directory and save with the original filename
				const options = {
				  uri: url,
				  dir: __dirname + '/images/' + show + '/' + designer + '/',
				  filename:  designer + ' ' + i + '.jpg'         // Save to /path/to/dest/image.jpg
				}
				p = p.then(download.bind(null, options));
		})
	})
	p.then(_ => console.log('done'));
}
getShowSlugs()
//getShowImages('christopher-esber', 40)
//getShows()
//getImages()