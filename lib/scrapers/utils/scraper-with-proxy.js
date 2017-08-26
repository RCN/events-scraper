/*
Builds a scraper with proxy server
*/

import buildScraper from 'little-scraper'

const buildScraperWithProxy = config =>
  buildScraper({
    // proxyUrl: 'http://open.proxymesh.com:31280',
    // proxyUrl: 'http://nl.proxymesh.com:31280',
    // proxyUrl: 'http://us-fl.proxymesh.com:31280', // blocked bikereg
    // proxyUrl: 'http://us-ca.proxymesh.com:31280', //partially blocked bikereg
    // proxyUrl: 'http://us-wa.proxymesh.com:31280',
    headers: {
      // 'X-ProxyMesh-Country': 'RU',
      'Proxy-Authorization':
        'Basic ' +
        new Buffer(
          `restuta8@gmail.com:${process.env.PROXY_MESH_PWD}`
        ).toString('base64')
    },
    ...config
  })


  // rotating IP proxies
  /*
    http://proxymesh.com/ $10-20 month, 10-200 ips a day, depends if manual switch is ok
    http://shader.io/ more ips (pool of 100)
  */

  //proxy mesh proxies (requires following header to be set on request:
    //'Proxy-Authorization': 'Basic ' + new Buffer('restuta8@gmail.com:<pwd>').toString('base64'))

  // proxy: 'http://open.proxymesh.com:31280',
  // proxy: 'http://au.proxymesh.com:31280',      //all blocked (as of 2016)
  // proxy: 'http://us-ca.proxymesh.com:31280',   //all blocked (as of 2016)
  // proxy: 'http://us-ny.proxymesh.com:31280',   //all blocked (as of 2016)
  // proxy: 'http://us-il.proxymesh.com:31280',   //all blocked (as of 2016)

  // proxy: 'http://us-dc.proxymesh.com:31280',    //fast, some blocked
  // proxy: 'http://us-fl.proxymesh.com:31280',    //fast, not blocked
  // proxy: 'http://us.proxymesh.com:31280',      //fast, not blocked
  // proxy: 'http://uk.proxymesh.com:31280',      //fast, not blocked
  // proxy: 'http://ch.proxymesh.com:31280',      //fast, not blocked
  // proxy: 'http://de.proxymesh.com:31280',      //fast, not blocked
  // proxy: 'http://nl.proxymesh.com:31280',      //fast, not blocked
  // proxy: 'http://sg.proxymesh.com:31280',      //slow, not blocked


export default buildScraperWithProxy
