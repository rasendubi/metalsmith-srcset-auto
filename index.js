var debug = require('debug')('metalsmith-srcset-auto');
var cheerio = require('cheerio');
var minimatch = require('minimatch');
var { parse, join } = require('path');

module.exports = (options) => {
  return (files, metalsmith, done) => {
    for (const path in files) {
      if (!path.endsWith('.html')) {
        continue;
      }

      debug('processing', path);

      const $ = cheerio.load(files[path].contents.toString());
      $('img').each(function (i, elem) {
        const src = $(this).attr('src');
        debug('-> found img', src);

        const parts = parse(src);
        if (parts.dir[0] !== '/') {
          debug('   -> path does not start with "/", skipping');
          return;
        }

        const pattern = join(parts.dir.substring(1), parts.name + '@*' + parts.ext);
        debug('   -> pattern', pattern);

        const images = Object.keys(files).filter(minimatch.filter(pattern));
        debug('   -> images', images);

        if (!images.length) {
          return;
        }

        const srcset = images.map((img) => {
          const imgParts = parse(img);
          const descriptor = parse(img).name.match(/@(.*)/)[1];
          return `/${img} ${descriptor}`;
        }).join(',');
        debug('   -> srcset', srcset);

        $(this).attr('srcset', srcset);
      });

      files[path].contents = $.html();
    }

    setImmediate(done);
  };
};
