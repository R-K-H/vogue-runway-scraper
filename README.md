# Vogue Fashion Show Image Scraper
This nodejs application takes parameters and then builds several files to parse with other functions all in order to download and organize runway show "looks".

- https://www.vogue.com/fashion-shows

## Installation
Simple easy to use node app.

To use this you MUST have node installed on your system. Visit https://nodejs.org/en/ to download and install node.

Once you have node installed, locate the code button on this repository and click clone, be sure you're using HTTPS tab. It should be a url like this.

`https://github.com/R-K-H/vogue-runway-scraper.git`

In your terminal type `git clone https://github.com/R-K-H/vogue-runway-scraper.git`

Once you've cloned the respository change in to that directory using

```
cd vogue-runway-scraper
```

You'll need to install the packages this scraper requires with the following command.

```shell
npm install
```

Then to run the sofware you can use
```shell
npm start
```

or alternatively

```shell
node app.js
```

Please note that the rateLimit is set in milliseconds so 1000 ms = 1 second. If you're noticing issues with requests, try bumping it up, it'll reduce the frequency for the requests and might solve any issues.

Answer with all lowercase and hyphenated names so `chanel` or `spring-2019-ready-to-wear`, yes and no should be only yes and no and lowercase as well.


## Future
- Allow user to set folder location
- Setup unit tests
- Setup compare tests (eg. folders have more images than the look should)
- Compare image look number to what we saved it as (so you wouldn't ever pull a look that isn't the correct number)
- Cleanup (rename files to match functions or vice versa, etc)

## License
GPL-3.0 [https://www.gnu.org/licenses/gpl-3.0.en.html](https://www.gnu.org/licenses/gpl-3.0.en.html)

This is application / project / work in no way associated with Vogue, all mentions of Vogue or associates are property of the respective party. USE OF THIS APPLICATION WAIVES ANY CLAIMS TO OR OF THE DEVELOPER AND THIS APPLICATION IS TO BE USED AT YOUR OWN RISK.