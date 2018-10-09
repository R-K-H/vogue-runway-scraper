const dotenv = require("dotenv");
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const http = require('http')
const https = require('https')
const fs = require('fs')

const _ = require('lodash')

// Bring in all files for scraping
const scripts = require('./scripts.json')

// Iterate through each script object in the file
_.forEach(scripts, function(script) {
	let exp = /\\"url\\":\\"https:\/\/assets.vogue.com([\s\S]*?)\\"/g
	let collectionImages = _.values(script)[0].match(exp)
	let collection = {}
	collection[_.keys(script)[0]] = collectionImages
	let obj = JSON.stringify(collection)
	//Write the urls to another file
	fs.appendFile("./image-urls.json", obj + ',\n', function(err) {
	    if(err) {
	        return console.log(err);
	    }

	    console.log("The file was saved!");
	}); 
})