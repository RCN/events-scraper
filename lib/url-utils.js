import _ from 'lodash'
import queryString from 'query-string'

/*
  for every passed url creates a set of urls with all the values passed in, e.g. for 2 passed urls
  and 3 different values for the given urlParam it would output 2*3=6 urls.
*/
export const buildUrlsFor = (urlsWithContext, {urlParam, contextParam, values}) => {
  return urlsWithContext
    .map(urlWithContext => values.map(
      value => {
        let newUrl = _.cloneDeep(urlWithContext)
        newUrl.url += queryString.stringify({[urlParam]: value}) + '&'

        if (contextParam) {
          newUrl.context[contextParam] = value
        }

        return newUrl
      }
    ))
    .reduce((a, b) => a.concat(b), []) // flattening arrays
}

export default {
  buildUrlsFor
}
