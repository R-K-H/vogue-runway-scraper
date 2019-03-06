// This fetches from the page the total number of looks in the show for the season
    // TODO: We should really use this count to enforce the number of images we want to retrieve
    // from the graphql.
    getShowLookCount(collections) {
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
    getShowFolderImageCount(source) {
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

    loadFiles() {
        let show
        // Bring in the files
        const files = ['./json/shows.json',
                                        './json/look-counts.json',
                                        './json/folder-counts.json',
                                        './json/images.json'
                                    ]
        shows = JSON.parse(fs.readFileSync('./json/shows.json', 'utf8'));
    }

const compareFolderImageCountToLookCount = (folderCount, lookCount) => {
	folderCount.sort(function(a,b){
	    return (Object.keys(a)[0] > Object.keys(b)[0]) - 0.5;
	});
	console.log(JSON.stringify(folderCount));
}
