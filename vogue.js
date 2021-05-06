const fsp = require('fs').promises
const fs = require('fs')
const fetch = require('node-fetch')
const {pipeline} = require('stream')
const {promisify} = require('util')

class Vogue {
  constructor (rateLimit, season = null, designer = null) {
    this.season = season
    if (season != null) {
      this.season = season.toLowerCase()
    }
    this.rateLimit = rateLimit
    // Master object
    this.showImages = {}
    this.designer
    if (designer != null) {
      this.designer = designer.toLowerCase()
    }
  }

  async httpRequest (params) {
    try {
      let host = 'https://graphql.vogue.com/graphql?query='
      let fullUrl = host + params
      fullUrl = fullUrl.replace(/\s/g, "%20");
      let options = {
        method: 'GET'
      }
      const response = await fetch(fullUrl, options)
      const json = await response.json()
      return json.data
    } catch (error) {
      console.log(error)
    }
  }

  getAllBrands () {
    let allBrands = 'query{allBrands{Brand{name%20slug}}}'
    return this.httpRequest()
  }

  getAllSeasons () {
    let allSeasons = 'query{allSeasons{Season{name%20slug}}}'
    return this.httpRequest()
  }

  async getSeasonContent (season) {
    let allContent = 'query{ allContent( type: ["FashionShowV2"], first:100, filter: { season: { slug:"' + season + '" } }) { Content { id GMTPubDate url title slug _cursor_ ... on FashionShowV2 { instantShow brand { name slug } season { name slug year } photosTout { ... on Image { url } } } } pageInfo { hasNextPage hasPreviousPage startCursor endCursor } } }'
    return await this.httpRequest(allContent)
  }

  async getBrandConent(brand) {
    let allContent = 'query { allContent(type: ["FashionShowV2"], first: 100, filter: { brand: { slug: "' + brand + '" } }) { Content { id GMTPubDate url title slug _cursor_ ... on FashionShowV2 { instantShow brand { name slug } season { name slug year } photosTout { ... on Image { url } } } } pageInfo { hasNextPage hasPreviousPage startCursor endCursor } } }'
    return await this.httpRequest(allContent)
  }

  getSeasonBrandCollections (season = null, brand = null, slug) {
    let querySlug = slug
    if (season != null && brand != null) {
      querySlug = season + '/' + brand
    }
    let collections = 'query{ fashionShowV2(slug: "' + querySlug + '") { GMTPubDate url title slug id instantShow city { name } brand { name slug } season { name slug year } photosTout { ... on Image { url } } review { pubDate body contributor { author { name photosTout { ... on Image { url } } } } } galleries { collection { ... GalleryFragment } atmosphere { ... GalleryFragment } beauty { ... GalleryFragment } detail { ... GalleryFragment } frontRow { ... GalleryFragment } } video { url cneId title } } } fragment GalleryFragment on FashionShowGallery { title meta { ...metaFields } slidesV2 { ... on GallerySlidesConnection { slide { ... on Slide { id credit photosTout { ...imageFields } } ... on CollectionSlide { id type credit title photosTout { ...imageFields } }  __typename } } } } fragment imageFields on Image { id url caption credit width height } fragment metaFields on Meta { facebook { title description } twitter { title description } }'
    return this.httpRequest(collections)
  }

  async parseContent (content) {
    return content.allContent.Content
  }

  async parseCollections (collections) {
    // TODO: What if there are more galleries?
    return collections.fashionShowV2.galleries.collection.slidesV2.slide
  }

  async parseImageUrl (image) {
    return image.photosTout.url
  }

  async downloadImageTest (url, dir, subFolder, designer, number) {
    let fileExt = url.split('.').pop()
    const streamPipeline = promisify(pipeline)
    const response = await fetch(url)
    if (!response.ok) throw new Error(`unexpected response ${response.statusText}`)
    await streamPipeline(response.body, fs.createWriteStream(`images/${dir}/${subFolder}/${designer}_${number}.${fileExt}`))
    return `${designer}_${number}.${fileExt}`
  }

  async loadFile (fileName, dir, subFolder) {
    if (!fs.existsSync(`images/${dir}`)){
      fs.mkdirSync(`images/${dir}`)
    }
    if (!fs.existsSync(`images/${dir}/${subFolder}`)){
      fs.mkdirSync(`images/${dir}/${subFolder}`)
    }
    let fileHandle = await fsp.open(`images/${dir}/${subFolder}/${fileName}`, 'a+')
    let fileContents = await fsp.readFile(`images/${dir}/${subFolder}/${fileName}`, 'utf8')
    if (fileContents) {
      fileContents = fileContents.split(',')
    } else {
      fileContents = []
    }
    fileHandle.close()
    return fileContents
  }

  async writeToFile (fileName, dir, subFolder, data, imageUrl) {
    try{
      await fsp.writeFile(`images/${dir}/${subFolder}/${fileName}`, data)
      return `added ${imageUrl} to processed list`
    } catch (error) {
      throw new Error(`unable to write to file ${error}`)
    }
  }
  // TODO: Add in folder selection
  // TODO: Add in naming selection
  // TODO: Setup so you can run commands specifically
  // TODO: Fetch all of everything (brands / seasons)
  async run () {
    if (this.season != null) {
      console.log(`season has been defined, running season collector.....`)
      let response = await this.getSeasonContent(this.season)
      let seasonArray = await this.parseContent(response)
      for (let i = 0; seasonArray.length > i; i++) {
        let designer = seasonArray[i].brand.slug
        console.log(`found designer ${designer} processing...`)
        
        let season = seasonArray[i].season.slug
        console.log(`found season ${season} processing...`)
        
        let collections = await this.getSeasonBrandCollections(null, null, seasonArray[i].slug)
        let images = await this.parseCollections(collections)
        let fileName = `${designer}_${season}.txt`
        
        for (let j = 0; images.length > j; j++) {
          let imageUrl = await this.parseImageUrl(images[j])
          
          let fileContents = await this.loadFile(fileName, season, designer)
          if (fileContents.includes(imageUrl)) {
            console.log('we already have the file skipping...')
            continue
          }
          console.log(`downloading ${imageUrl}...`)
          let image = await this.downloadImageTest(imageUrl, season, designer, designer, j)
          fileContents.push(imageUrl)
          console.log(await this.writeToFile(fileName, season, designer, fileContents, imageUrl))
          console.log(`waiting ${this.rateLimit}...`)
          await this.sleep(this.rateLimit)
        }
      }
    } else if (this.designer != null) {
      console.log(`designer has been defined, running designer collector.....`)
      let response = await this.getBrandConent(this.designer)
      let brandSeasonArray = await this.parseContent(response)
      for (let i = 0; brandSeasonArray.length > i; i++) {
        let designer = brandSeasonArray[i].brand.slug
        console.log(`found designer ${designer} processing...`)
        
        let season = brandSeasonArray[i].season.slug
        console.log(`found season ${season} processing...`)
        
        let collections = await this.getSeasonBrandCollections(null, null, brandSeasonArray[i].slug)
        let images = await this.parseCollections(collections)
        let fileName = `${designer}_${season}.txt`
        
        for (let j = 0; images.length > j; j++) {
          let imageUrl = await this.parseImageUrl(images[j])
          
          let fileContents = await this.loadFile(fileName, designer, season)
          if (fileContents.includes(imageUrl)) {
            console.log('we already have the file skipping...')
            continue
          }
          console.log(`downloading ${imageUrl}...`)
          let image = await this.downloadImageTest(imageUrl, designer, season, designer, j)
          fileContents.push(imageUrl)
          console.log(await this.writeToFile(fileName, designer, season, fileContents, imageUrl))
          console.log(`waiting ${this.rateLimit}...`)
          await this.sleep(this.rateLimit)
        }
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
}

module.exports = Vogue
