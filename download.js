const dotenv = require("dotenv");
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const http = require('http')
const https = require('https')
const fs = require('fs')
const _ = require('lodash')
const request = require('request')

const show = 'spring-2019-ready-to-wear'
// Bring in all files for scraping
const imageSets = require('./image-urls.json')

const newImageSets = require('./show-images.json')

const download = function(options){
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

const getImages2 = () => {
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

// Iterate through each script object in the file
const getImages = async function() {
	var p = Promise.resolve();
	_.forEach(imageSets, async function(set) {
		var i = 0;
		_.forEach(_.values(set)[0], async function(image) {
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
				p = p.then(download.bind(null, options));
		})
	})
	p.then(_ => console.log('done'));
}
getImages2()
