const R = require('ramda')
// replaces original items with given array of items using predicate
// if predicate returns true, item will be replaced in original items at the same index
// with  the item from "replaceWithItems"
const replaceBy = R.curry((predicate, replaceWithItems, originalItems) =>
  R.compose(
    R.reduce(
      (acc, itemsMap) =>
        R.update(itemsMap.index, itemsMap.item, acc),
      originalItems
    ),
    R.map(replacementItem => ({
      item: replacementItem,
      index: R.findIndex(
        originalItem => predicate(originalItem, replacementItem),
        originalItems
      )
    }))
  )(replaceWithItems))

module.exports = {
  replaceBy
}
