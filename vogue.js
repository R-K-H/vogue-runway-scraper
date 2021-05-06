const https = require('https')
const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const Xray = require('x-ray')
const request = require('request')

const x = Xray({ filters: {
  encodeUri: value => {
    return typeof value === 'string' ? encodeURIComponent(value) : value
  },
  stripSlug: value => {
    const regex = /(?=[^\/]+$)(.*)/
    return typeof value === 'string' ? regex.exec(value)[0] : value
  },
  formatSlug: value => {
    return typeof value === 'string' ? value.toUpperCase().replace(/(-+)/g, ' ') : value
  },
  countToInt: value => {
    return typeof value === 'string' ? parseInt(value) : value
  },
  nullify: value => {
    return value.length ? value : null
  },
  makeSmall: value => {
    return typeof value === 'string' ? value.toLowerCase().replace(/ /g, '-') : value
  }
} })

class Vogue {
  constructor (rateLimit, show = null, designer = null) {
    this.show = show
    if (show != null) {
      this.show = show.toLowerCase()
    }
    this.rateLimit = rateLimit
    // Master object
    this.showImages = {}
    this.designer
    if (designer != null) {
      this.designer = designer.toLowerCase()
    }
  }

  async checkFile (file) {
    try {
      if (fs.existsSync(file)) {
        return await JSON.parse(fs.readFileSync(file, 'utf8'))
      } else {
        console.log('Empty file found for: ', file)
        return {}
      }
    } catch (err) {
      return err
    }
  }

  checkStep = async (file, stepCount) => {
    let readFile = await this.checkFile(file)
    let fileName = this.show
    if (this.designer != null) {
      fileName = this.designer
    }
    if (_.isEmpty(readFile)) {
      if (stepCount === 1) {
        if (this.designer != null) {
          let shows = await this.getDesignerShowsList()
          console.log('shows:', shows)
          if (shows) {
            fs.appendFile('./json/' + fileName + '-shows.json', JSON.stringify(shows), err => {
              if (err) {
                console.log('error with looks file', err)
              }
              console.log('Saved all looks to json file')
            })
            return new Promise((resolve, reject) => { resolve(shows) })
          }
        } else {
          let looks = await this.getShowsLooksList()
          console.log('looks:', looks)
          if (looks) {
            fs.appendFile('./json/' + fileName + '-looks.json', JSON.stringify(looks), err => {
              if (err) {
                console.log('error with looks file', err)
              }
              console.log('Saved all looks to json file')
            })
            return new Promise((resolve, reject) => { resolve(looks) })
          }
         }
      } else if (stepCount === 2) {
        await this.getAllShowsLooksImages()
        console.log('returned we awaited images')
        if (this.showImages) {
          fs.appendFile('./json/' + fileName + '-images.json', JSON.stringify(this.showImages), err => {
            if (err) {
              console.log('error with images file', err)
            }
            console.log('Saved all images to json file')
          })
          return new Promise((resolve, reject) => { resolve(this.showImages) })
        } else {
          console.log("Unable to fetch images, something went wrong.")
        }
      }
    } else {
      return readFile
    }
  }

  getDesignerShowsList() {
    if (this.designer != null) {
      return new Promise((resolve, reject) => {
        x('https://www.vogue.com/fashion-shows/designer/' + this.designer,
          '.grid.grid-even a', [
            {
              show: 'h3@html | makeSmall'
            }
          ]
        ).then(res => { resolve(res) })
      })
    } else {
      console.log("You didn't specify a designer.")
    }
  }

  // Build list of all the shows with their vogue url as well as their titles
  getShowsLooksList () {
    return new Promise((resolve, reject) => {
      x('https://www.vogue.com/fashion-shows/' + this.show, 
        '.grouped-navigation--a-to-z li', [
          {
            prettyTitle: 'a@html | encodeUri',
            title: 'a@href | stripSlug | formatSlug',
            link: 'a@href',
            brandSlug: 'a@href | stripSlug'
          }
        ]
      ).then(res => { resolve(res) })
    })
  }

  // This gets all the looks for each show by iterating though the getShowImagesUrl which writes it to a JSON file
  getAllShowsLooksImages = async () => {
    let fileName = this.show + '-looks.json'
    if (this.designer != null) {
      fileName = this.designer + '-shows.json'
    }
    let file = './json/' + fileName
    // Check to see if file has contents if not run to generate
    let collections = await this.checkStep(file, 1)
    if (collections) {
      let p = Promise.resolve()
      let promises = []
      if (this.designer != null) {
        const brandShows = collections
        let shows = []
        for (let i = 0; brandShows.length > i; i++) {
          shows.push(brandShows[i].show)
        }
        let sortedShows = shows.sort()
        for (let i = 0; sortedShows.length > i; i++) {
          let params = {
            brandSlug: this.designer,
            count: 200,
            last: false,
            index: i,
            length: sortedShows.length,
            show: sortedShows[i]
          }
          await promises.push(p = p.then(this.getShowImagesUrl.bind(this, params))
            .catch(err => console.log('\x1b[41m%s\x1b[0m', err))
          )
        }
      } else {
        let _show = this.show
        let brandSlug = []
        for (let i = 0; collections.length > i; i++) {
          if (collections[i].hasOwnProperty('prettyTitle') && collections[i].prettyTitle !== null) {
            if (collections[i].brandSlug !== undefined && !collections[i].brandSlug.toLowerCase().includes("#")) {
              brandSlug.push(collections[i].brandSlug)
            }
          }
        }
        
        
        let sortedBrandSlug = brandSlug.sort()
        
        for (let i = 0; sortedBrandSlug.length > i; i++) {
          let params = {
            brandSlug: sortedBrandSlug[i],
            count: 200,
            last: false,
            index: i,
            length: sortedBrandSlug.length,
            show: _show
          }
          await promises.push(p = p.then(this.getShowImagesUrl.bind(this, params))
            .catch(err => console.log('\x1b[41m%s\x1b[0m', err))
          )
        }
      }
      await Promise.all(promises)
        .then(resp => {
          if (resp) {
            return new Promise((resolve, reject) => { resolve(this.showImages) })
          }
        })
        .catch(error => {
          console.log("error", error)
          return new Promise((resolve, reject) => { reject(false) })
        })
    }
  }

  // This is what gets the images from the JSON file, it creates an array of
  // promises in order to ensure each image is downloaded before the next one starts
  // so as not to a) kill your internet connection (show for 2019-spring was ~20GB)
  // and b) not to upset vogue with too many requests.
  downloadLookImages = async () => {
    let fileName = this.show
    if (this.designer != null) {
      fileName = this.designer
    }
    let file = './json/' + fileName + '-images.json'
    // Check to see if file has contents if not run to generate
    let imageSets = await this.checkStep(file, 2)
    if (imageSets) {
      let p = Promise.resolve()
      let j = 0
      _.forEach(imageSets, set => {
        let i = 0
        _.forEach(set, image => {
          i++
          let url = image
          let designer = this.designer
          let show = this.show
          let parentDir = path.join(__dirname, '/images/', show)
          let dir = path.join(__dirname, '/images/', show, '/', designer, '/')
          if (this.designer != null) {
            show = _.keys(imageSets)[j]
            parentDir = path.join(__dirname, '/images/', designer)
            dir = path.join(__dirname, '/images/', designer, '/', show, '/')
          } else {
            designer = _.keys(imageSets)[j]
          }
          show = show.toLowerCase()
          designer = designer.toUpperCase().replace(/(-+)/g, ' ')
          // Download to a directory and save with the original filename
          const params = {
            uri: url,
            parentDir: parentDir,
            dir: dir,
            designer: designer,
            filename: designer + ' ' + i + '.jpg' // Save to /path/to/dest/image.jpg
          }
          p = p.then(this.downloadImage.bind(this, params))
        })
        j++
      })
      p.then(resp => {
        if (resp) {
          console.log('\x1B[0Gdone downloading all images')
          return new Promise((resolve, reject) => { resolve(true) })
        }
      })
    }
  }

  apiEndpoints () {
    let allBrands = 'query{allBrands{Brand{name%20slug}}}'
    let allSeasons = 'query{allSeasons{Season{name%20slug}}}'
    let collections = ' query{ fashionShowV2(slug: "fall-2019-ready-to-wear/chanel") { GMTPubDate url title slug id instantShow city { name } brand { name slug } season { name slug year } photosTout { ... on Image { url } } review { pubDate body contributor { author { name photosTout { ... on Image { url } } } } } galleries { collection { ... GalleryFragment } atmosphere { ... GalleryFragment } beauty { ... GalleryFragment } detail { ... GalleryFragment } frontRow { ... GalleryFragment } } video { url cneId title } } } fragment GalleryFragment on FashionShowGallery { title meta { ...metaFields } slidesV2 { ... on GallerySlidesConnection { slide { ... on Slide { id credit photosTout { ...imageFields } } ... on CollectionSlide { id type credit title photosTout { ...imageFields } }  __typename } } } } fragment imageFields on Image { id url caption credit width height } fragment metaFields on Meta { facebook { title description } twitter { title description } }'
    let allContent = 'query { allContent(type: ["FashionShowV2"], first: 25, filter: { brand: { slug: "chanel" } }) { Content { id GMTPubDate url title slug _cursor_ ... on FashionShowV2 { instantShow brand { name slug } season { name slug year } photosTout { ... on Image { url } } } } pageInfo { hasNextPage hasPreviousPage startCursor endCursor } } }'
  }
  // This uses vogues graphql to get a list from the shows using the slug and a modified count (to fetch them all)
  // TODO: Look into their actual graphql to see if we could simplify this and retrieve what we want to in a more
  // ordered fashion vs their user for slideshows.
  getShowImagesUrl (params) {
    return new Promise((resolve, reject) => {
      let query = `
            /graphql?query=query%20SlideshowPortraitPageRelayPaginationQuery(
              $brandSlug:String!%20
              $count:Int!%20
              $cursor:String%20
              $galleryType:FashionGalleryTypeEnum!%20
              $seasonSlug:String!%20
            ){...SlideshowPortraitPageRelay}
            fragment%20
            SlideshowPortraitPageRelay%20
            on%20
            Root{
              fashionShow:fashionShowV2(slug:null){photosTout{
                   __typename%20
                   ...%20
                   on%20
                   Image{url%20id}
                   ...%20
                   on%20
                   Video{id}
                   ...%20
                   on%20
                   Clip{id}
                 }
                 url%20
                 brand{slug%20id}
                 season{slug%20id}
                 galleries{
                   collection{id}
                   atmosphere{id}
                   beauty{id}
                   detail{id}
                   frontRow{id}
                 }
                 functionalTags{name%20id}
                id
               }
               fashionGallery:fashionGalleryByType(
                 brandSlug:$brandSlug,
                 seasonSlug:$seasonSlug,
                 galleryType:$galleryType
               ){
                 slideCount%20
                 slidesV2(
                   after:$cursor,
                   first:$count
                 ){
                   edges{
                     node{
                         __typename%20
                         ...%20
                         on%20
                         SlideInterface{
                           id%20
                           photosTout{
                             __typename%20
                             ...%20
                             on%20
                             Image{url%20id}
                           }
                         }
                         ...%20
                         on%20
                         Slide{id}
                       }
                       cursor
                     }
                   }
                 }
               }
      `

      let vars = `&variables={
                              %22brandSlug%22:%22${params.brandSlug}%22,
                              %22count%22:${params.count},
                              %22galleryType%22:%22collection%22,
                              %22seasonSlug%22:%22${params.show}%22
                            }`
      let fullQuery = query + vars
      fullQuery = fullQuery.replace(/\s/g, "");
      // console.log(fullQuery)
      let options = {
        host: 'graphql.vogue.com',
        path: fullQuery
      }
      let content = ''
      let req = https.request(options, res => {
        res.setEncoding('utf8')
        res.on('data', chunk => {
          content += chunk
        })

        res.on('end', () => {
          let obj = JSON.parse(content)
          if (obj.data !== undefined && obj.data.hasOwnProperty('fashionGallery') && obj.data.fashionGallery !== null) {
            if (obj.data.fashionGallery.hasOwnProperty('slidesV2') && obj.data.fashionGallery !== null) {
              let images = obj.data.fashionGallery.slidesV2.edges
              let imageArry = []
              _.forEach(images, image => {
                imageArry.push(image.node.photosTout.url)
              })
              if (this.designer != null) {
                this.showImages[params.show] = imageArry
              } else {
                this.showImages[params.brandSlug] = imageArry
              }
              
              console.log('\x1B[0GFetching images list for ' + params.brandSlug + ' ' + (params.index + 1) + '/' + params.length + '\x1B[0G')
              // TODO: Write to file as we go along.
              setTimeout(resolve, this.rateLimit)
            } else {
              reject('no images found for ' + params.brandSlug + ' ' + (params.index + 1) + '/' + params.length)
            }
          } else {
            reject('fetch failed for ' + params.brandSlug + ' ' + (params.index + 1) + '/' + params.length)
          }
        })
      })
      // Was going to make this just output then build into a entire string output to file
      req.end()
    })
  }

  // This makes a request to fetch the images it does a check to see if the folder already exists
  // and if it does if the image exists and it's of the same size, if not it creates the folder, and
  // saves the image.
  downloadImage (params) {
    return new Promise((resolve, reject) => {
      const uri = params.uri
      const dir = params.dir
      const parentDir = params.parentDir
      const filename = params.filename
      let fileSizeInBytes = 0
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir)
      }
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
      if (fs.existsSync(dir + filename)) {
        process.stdout.clearLine()
        process.stdout.write('\x1B[0GFile already exists.')
        let stats = fs.statSync(dir + filename)
        fileSizeInBytes = stats.size
      }

      request.get(uri)
        .on('error', err => {
          console.log('error', err)
          reject(err)
        })
        .on('response', response => {
          let message = Number((response.headers['content-length'] * 0.001).toFixed(4)) + ' KB'
          if ((response.headers['content-length'] * 0.000001) > 1) {
            message = Number((response.headers['content-length'] * 0.000001).toFixed(4)) + ' MB'
          }
          if (fileSizeInBytes == response.headers['content-length']) {
            // TODO: add in close connection so we terminate
            process.stdout.write('\x1B[0GCompared ' + filename + ' stored file size matches fetched file size: ' + message + '\x1B[0G')
            setTimeout(resolve, this.rateLimit)
          } else {
            process.stdout.clearLine()
            console.log('\x1B[0GDownloading ' + filename + ' with a size of ' + message + '\x1B[0G')
            response.pipe(fs.createWriteStream(dir + filename))
              .on('close', () => {
                setTimeout(resolve, this.rateLimit)
              })
          }
        })
    })
  }

  async run () {
    await this.downloadLookImages()
  }
}

module.exports = Vogue
