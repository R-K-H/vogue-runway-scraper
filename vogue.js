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
    const regex = /(?=[^/]+$)(.*)/
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
  }
} })

class Vogue {
  constructor (show, rateLimit) {
    this.show = show
    this.rateLimit = rateLimit
    // Master object
    this.showImages = {}
  }

  async checkFile (file) {
    try {
      if (fs.existsSync(file)) {
        return await JSON.parse(fs.readFileSync(file, 'utf8'))
      } else {
        console.log('Empty file found.')
        return {}
      }
    } catch (err) {
      return err
    }
  }

  async checkStep (file, stepCount) {
    let readFile = await this.checkFile(file)
    if (_.isEmpty(readFile)) {
      if (stepCount === 1) {
        let looks = await this.getShowsLooksList()
        console.log(looks)
        if (looks) {
          fs.appendFile('./json/' + this.show + '-looks.json', JSON.stringify(looks), err => {
            if (err) {
              console.log(err)
            }
            console.log('Saved all looks to json file')
          })
          return new Promise((resolve, reject) => { resolve(looks) })
        }
      } else if (stepCount === 2) {
        let images = await this.getAllShowsLooksImages()
        if (images) {
          fs.appendFile('./json/' + this.show + '-images.json', JSON.stringify(this.showImages), err => {
            if (err) {
              console.log(err)
            }
            console.log('Saved all images to json file')
          })
          return new Promise((resolve, reject) => { resolve(images) })
        }
      }
    } else {
      return new Promise((resolve, reject) => { resolve(readFile) })
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
            slug: 'a@href | stripSlug'
          }
        ]
      )
        .then(res => { resolve(res) })
    })
  }

  // This gets all the looks for each show by iterating though the getShowImagesUrl which writes it to a JSON file
  async getAllShowsLooksImages () {
    let file = './json/' + this.show + '-looks.json'
    // Check to see if file has contents if not run to generate
    let collections = await this.checkStep(file, 1)
    if (collections) {
      return new Promise((resolve, reject) => {
        let slugs = []
        _.forEach(collections, collection => {
          if (collection.prettyTitle !== null) {
            slugs.push(collection.slug)
          }
        })
        let sortedSlugs = slugs.sort()
        let p = Promise.resolve()
        let promises = []
        _.forEach(sortedSlugs, (slug, index, array) => {
          let params = {
            slug: slug,
            count: 200,
            last: false,
            index: index,
            length: array.length
          }
          promises.push(p = p.then(this.getShowImagesUrl.bind(this, params))
            .catch(err => console.log('\x1b[41m%s\x1b[0m', err))
          )
        })
        Promise.all(promises)
          .then(resp => {
            if (resp) {
              resolve(this.showImages)
            }
          })
          .catch(error => {
            console.log(error)
            reject(false)
          })
      })
    }
  }

  // This is what gets the images from the JSON file, it creates an array of
  // promises in order to ensure each image is downloaded before the next one starts
  // so as not to a) kill your internet connection (show for 2019-spring was ~20GB)
  // and b) not to upset vogue with too many requests.
  async downloadLookImages () {
    let file = './json/' + this.show + '-images.json'
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
          let designer = _.keys(imageSets)[j].toUpperCase().replace(/(-+)/g, ' ')
          // Download to a directory and save with the original filename
          const params = {
            uri: url,
            parentDir: path.join(__dirname, '/images/', this.show),
            dir: path.join(__dirname, '/images/', this.show, '/', designer, '/'),
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

  // This uses vogues graphql to get a list from the shows using the slug and a modified count (to fetch them all)
  // TODO: Look into their actual graphql to see if we could simplify this and retrieve what we want to in a more
  // ordered fashion vs their user for slideshows.
  getShowImagesUrl (params) {
    return new Promise((resolve, reject) => {
      let query = '/graphql?query=query%20SlideshowPortraitPageRelayPaginationQuery($brandSlug:String!%20$count:Int!%20$cursor:String%20$galleryType:FashionGalleryTypeEnum!%20$hierarchy:String%20$seasonSlug:String!%20$slug:String){...SlideshowPortraitPageRelay}fragment%20SlideshowPortraitPageRelay%20on%20Root{...SiteContainerRelay%20...EndSlideRelay_data%20...SwipeSlideshowRelay_data%20fashionShow:fashionShowV2(slug:$slug){...RunwaySlideshowHeaderRelay_fashionShow%20photosTout{__typename%20...%20on%20Image{url%20id}...%20on%20Video{id}...%20on%20Clip{id}}...SlideshowTitleRelay_fashionShow%20...EndSlideRelay_fashionShow%20...SwipeSlideshowRelay_fashionShow%20...SocialSharerRelay%20...BaseHelmetRelay%20url%20brand{slug%20id}season{slug%20id}galleries{collection{id}atmosphere{id}beauty{id}detail{id}frontRow{id}}functionalTags{name%20id}id}fashionGallery:fashionGalleryByType(brandSlug:$brandSlug,seasonSlug:$seasonSlug,galleryType:$galleryType){...SlideshowAdColumnRelay_fashionGallery%20...SocialSharerRelay%20slideCount%20slidesV2(after:$cursor,first:$count){edges{node{__typename%20...%20on%20SlideInterface{...GridViewRelay_slides%20caption%20credit%20id%20photosTout{__typename%20...%20on%20Image{url%20id}...%20on%20Video{id}...%20on%20Clip{id}}}...%20on%20CollectionSlide{details{...%20on%20Slide{photosTout{__typename%20...%20on%20Image{url%20id}...%20on%20Video{id}...%20on%20Clip{id}}}id}id}...%20on%20Slide{id}}cursor}pageInfo{endCursor%20hasNextPage}}id}}fragment%20SiteContainerRelay%20on%20Root{...FeedHeaderRelay%20...SiteHeaderRelay}fragment%20EndSlideRelay_data%20on%20Root{allContent(first:10,type:[%22FashionShowV2%22]){edges{node{__typename%20...%20on%20FashionShowV2{id%20url%20brand{name%20id}season{name%20id}galleries{atmosphere{photosTout{__typename%20...%20on%20Image{altText%20url%20id}...%20on%20Video{id}...%20on%20Clip{id}}id}beauty{photosTout{__typename%20...%20on%20Image{altText%20url%20id}...%20on%20Video{id}...%20on%20Clip{id}}id}collection{photosTout{__typename%20...%20on%20Image{altText%20url%20id}...%20on%20Video{id}...%20on%20Clip{id}}id}detail{photosTout{__typename%20...%20on%20Image{altText%20url%20id}...%20on%20Video{id}...%20on%20Clip{id}}id}frontRow{photosTout{__typename%20...%20on%20Image{altText%20url%20id}...%20on%20Video{id}...%20on%20Clip{id}}id}}}id}}}}fragment%20SwipeSlideshowRelay_data%20on%20Root{...EndSlideRelay_data}fragment%20RunwaySlideshowHeaderRelay_fashionShow%20on%20FashionShowV2{...SlideshowTitleRelay_fashionShow}fragment%20SlideshowTitleRelay_fashionShow%20on%20FashionShowV2{brand{name%20url%20id}season{name%20url%20id}}fragment%20EndSlideRelay_fashionShow%20on%20FashionShowV2{...SlideshowTitleRelay_fashionShow%20...SocialSharerRelay%20season{name%20url%20id}}fragment%20SwipeSlideshowRelay_fashionShow%20on%20FashionShowV2{...EndSlideRelay_fashionShow%20brand{slug%20id}}fragment%20SocialSharerRelay%20on%20Content{__typename%20id%20title%20url%20photosTout{__typename%20...%20on%20Image{url%20id}...%20on%20MixedMedia{default{__typename%20...%20on%20Image{title%20url}id}}...%20on%20Video{id}...%20on%20Clip{id}}GMTPubDate%20GMTModDate%20meta{facebook{title%20description%20imageURL}seo{title%20description%20keywords}twitter{title%20description%20imageURL}}}fragment%20BaseHelmetRelay%20on%20Content{...%20on%20FashionShowV2{reviewContributors:review{contributor{artist{name%20id}author{name%20id}editor{name%20id}photographer{name%20id}videographer{name%20id}}id}functionalTags{name%20id}}GMTPubDate%20GMTModDate%20channels{id%20name}channel{id%20name%20parent{id%20name}}tags{id%20name}contributor{artist{name%20id}author{name%20id}editor{name%20id}photographer{name%20id}videographer{name%20id}}meta{facebook{title%20description%20imageURL}seo{title%20description%20keywords}twitter{title%20description%20imageURL}}}fragment%20SlideshowAdColumnRelay_fashionGallery%20on%20FashionShowGallery{...SocialSharerRelay}fragment%20GridViewRelay_slides%20on%20SlideInterface{photosTout{__typename%20...%20on%20Image{url%20id}...%20on%20Video{id}...%20on%20Clip{id}}}fragment%20FeedHeaderRelay%20on%20Root{headerTerm:term(hierarchy:$hierarchy){...TermSocialSharerRelay%20name%20description%20pageHeader{colorScheme%20bannerLink%20bannerLinkTitle%20bannerImage}parent{name%20pageHeader{colorScheme%20bannerLink%20bannerLinkTitle%20bannerImage}id}id}}fragment%20SiteHeaderRelay%20on%20Root{allSeasons(first:10){edges{node{id%20name%20url}}}}fragment%20TermSocialSharerRelay%20on%20Term{name%20url%20meta{facebook{title%20description%20imageURL}seo{title%20description%20keywords}twitter{title%20description%20imageURL}}}&variables='

      let vars = '{%22brandSlug%22:%22' + params.slug + '%22,%22count%22:'+ params.count +',%22galleryType%22:%22collection%22,%22hierarchy%22:null,%22seasonSlug%22:%22' + this.show + '%22,%22slug%22:null}'
      let fullQuery = query + vars
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
              this.showImages[params.slug] = imageArry
              console.log('\x1B[0GFetching images list for ' + params.slug + ' ' + (params.index + 1) + '/' + params.length + '\x1B[0G')
              // TODO: Write to file as we go along.
              setTimeout(resolve, this.rateLimit)
            } else {
              reject('no images found for ' + params.slug + ' ' + (params.index + 1) + '/' + params.length)
            }
          } else {
            reject('fetch failed for ' + params.slug + ' ' + (params.index + 1) + '/' + params.length)
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
          console.log(err)
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
