//Functions to manipulate data here

/**
 * Emojilib's structure uses an emoji as a key and a list of words as the values
 * Restructures the data into word:emoji pairs for simpler lookup later
 * @param {Object} data - Key:value associations that we want to reverse
 * @returns {Map} - A Map object with the original values as keys and the original keys as values
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
