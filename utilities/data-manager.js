

/**
 * emojilib's structure uses an emoji as the key and lists of words as the values
 * this just restructures the data into word:emoji pairs for simpler matching later
 * @param {Object} data - The data structure containing word-to-value associations.
 * @returns {Map} - A Map object where words are keys and values are associated values.
 */
function buildReverseIndex(data) {
    const reverseIndex = {};
    for (const key in data) {
      for (const entry of data[key]) {
        if (!reverseIndex[entry]) {
          reverseIndex[entry] = [];
        }
        reverseIndex[entry].push(key);
      }
    }
  
    return reverseIndex;
  }
  

module.exports = { buildReverseIndex };