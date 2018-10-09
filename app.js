const dotenv = require("dotenv");
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const http = require('http')
const https = require('https')
const fs = require('fs')
//const Path = require("path")
const _ = require('lodash')
const collections = require('./results.json');
const Xray = require('x-ray');
const x = Xray({filters: {
    trim: function (value) {
      return JSON.parse(value)
    }
}});

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
	.write('results.json')
} else {
	_.forEach(collections, function(collection) {
		let collectionTitle = collection.title
		let link = 'www.vogue.com' 
		let path = collection.link.replace('https://'+link, '')
		var options = {
		  host: link,
		  path: path + '/slideshow/collection'
		};

		let content = "";  
		let req = https.request(options, function(res) {
		    res.setEncoding("utf8");
		    res.on("data", function (chunk) {
		        content += chunk;
		    });

		    res.on("end", function () {
		        x(content, 
					['script'])(function(err, obj){
						let string = JSON.stringify(obj)
						let collect = {}
						let thing = string.replace(/\n/g, ' ');
						collect[collectionTitle] = thing
						
						fs.appendFile('scripts.json', JSON.stringify(collect) + ',\n', function (err) {
						  if (err) throw err;
						  console.log('Saved!');
						});
					})
		    });
		});

		req.end();
	})
}