const { pipe, groupBy, toPairs, map, orderBy, curry } = require('lodash/fp')

/**
 * Groups objects by the given prop and calculates count of items in each group
 * and then orders by count
 * @param {[type]} propName [description]
 * @returns {[type]} Array of array pairs with [propName, count]
 */
const countBy = propName => pipe(
  groupBy(propName),
  toPairs,
  map(([state, events]) => ([state, events.length])),
  orderBy(['1'], ['desc'])
)

module.exports = {
  countBy: curry((propName, objectsArr) => countBy(propName)(objectsArr))
  // countBy: curry(countBy)
}
