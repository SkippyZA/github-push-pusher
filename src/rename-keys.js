'use strict';

let R = require('ramda');

/**
 * Creates a new object with the own properties of the provided object, but the
 * keys renamed according to the keysMap object as `{oldKey: newKey}`.
 * When some key is not found in the keysMap, then it's passed as-is.
 *
 * Keep in mind that in the case of keys conflict is behaviour undefined and
 * the result may vary between various JS engines!
 *
 * @See: https://github.com/ramda/ramda/wiki/Cookbook#rename-keys-of-an-object
 * @sig {a: b} -> {a: *} -> {b: *}
 */
const renameKeys = R.curry((keysMap, obj) => {
  return R.reduce((acc, key) => {
    acc[keysMap[key] || key] = obj[key];
    return acc
  }, {}, R.keys(obj))
});

module.exports = renameKeys;