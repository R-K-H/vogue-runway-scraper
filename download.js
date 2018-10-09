const dotenv = require("dotenv");
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const http = require('http')
const https = require('https')
const fs = require('fs')
const _ = require('lodash')
const request = require('request')
//const download = require('image-downloader')

const show = 'spring-2019-ready-to-wear'
// Bring in all files for scraping
const imageSets = require('./image-urls.json')

const download = function(options){
	return new Promise(function(resolve, reject) {
		var uri = options.uri
		var dir = options.dir
		var filename = options.filename
		if (!fs.existsSync(dir)){
		    fs.mkdirSync(dir);
		}
		request.get(uri)
		.on('error', function(err) {
		    console.log(err)
		    reject(err)
		})
		.on('response', function(response) {
		    console.log(response.statusCode) // 200
		    console.log(response.headers['content-type']) // 'image/png'
		})
		.pipe(fs.createWriteStream(dir + filename))
		.on('close', function() {
		    	resolve(true)
		})
	})
}

// Iterate through each script object in the file
const getImages = function() {
	_.forEach(imageSets, function(set) {
		var i = 0;
		_.forEach(_.values(set)[0], async function(image) {
			if(i > 4){
				return
			}
			i ++
			var url = image.replace('\\"url\\":\\"', '')
			url = url.replace('\\"','')

			var designer = _.keys(set)[0].toUpperCase().replace(/(\/+)/g, ' ')
			designer = designer.replace(/(\s+)/g, '\$1')
			// Download to a directory and save with the original filename
			const options = {
			  uri: url,
			  dir: __dirname + '/images/' + show + '/' + designer + '/',
			  filename:  designer + ' ' + i + '.jpg'         // Save to /path/to/dest/image.jpg
			}
			await download(options)
			.then(resp => {console.log(resp)})
			.catch(err => console.log(err))
			// download.image(options)
			//   .then(({ filename, image }) => {
			//     console.log('File saved to', filename)
			//   })
			//   .catch((err) => {
			//     console.error(err)
			//   })
		})
		
	})
}
getImages()