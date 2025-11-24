const fs = require('fs');
const path = require('path');
const stylesPath = path.join(__dirname, 'text-styles.json');
const styles = fs.existsSync(stylesPath) ? JSON.parse(fs.readFileSync(stylesPath, 'utf8')) : {};
const vocabulary = require('../../utilities/phrases.json'); //slang translation data

/**
 * small helper to load up the text styles JSON file
 * 
 */

/**
 * Build full char->char map for one style definition.
 * Supports either:
 *  - full map (single-char keys)
 *  - compact { lower: "...", upper: "...", map: {...}, space: "..." }
 */
function _buildStyleMap(def) {
  if (!def) return {};
  const keys = Object.keys(def || {});
  if (keys.length > 0 && keys.every(k => k.length === 1)) return def;

  const map = {};
  if (def.map && typeof def.map === 'object') Object.assign(map, def.map);

  if (def.lower) {
    const lowers = Array.isArray(def.lower) ? def.lower.join('') : def.lower;
    for (let i = 0; i < 26; i++) {
      map[String.fromCharCode(97 + i)] = lowers[i] ?? String.fromCharCode(97 + i);
    }
  }

  if (def.upper) {
    const uppers = Array.isArray(def.upper) ? def.upper.join('') : def.upper;
    for (let i = 0; i < 26; i++) {
      map[String.fromCharCode(65 + i)] = uppers[i] ?? String.fromCharCode(65 + i);
    }
  }

  if (def.space !== undefined) map[' '] = def.space;

  return map;
}

// precompute maps once at module load
const _compiledStyles = Object.fromEntries(
  Object.entries(styles).map(([name, def]) => [name, _buildStyleMap(def)])
);

/**
 * Apply a named style to text.
 * exact-char mapping preferred; falls back to lowercase mapping for letters.
 */
function applyStyleToText(text, styleName) {
  const styleMap = _compiledStyles[styleName];
  if (!styleMap) throw new Error(`Style not found: ${styleName}`);
  return [...text].map(ch => styleMap[ch] ?? styleMap[ch.toLowerCase()] ?? styleMap[ch.toUpperCase()] ?? ch).join('');
}


/**
 * Matches phrases in the input text.
 * Why not tokenize the sentence and go word by word? Some of the phrases to match keys in the vocab
 * are multiple words: "see you later": "selongabye",
 * @param {string} text - The input text to be processed.
 * @param {string} translationKey - The key used to access the translation data from the vocabulary.
 * @param {boolean} allowPartials - A flag to indicate whether partially matching an input word is allowed.
 * @returns {string} The text with replacements.
 */
function replacePhrasesInText(text, translationKey, allowPartials = false) {
    const wordData = vocabulary[translationKey];
    let pattern;
    if (!wordData) {
        throw new Error (`No "${translationKey}" phrases are available`);
    }
    let translatedText = text;
    if(allowPartials){
        pattern = new RegExp(Object.keys(wordData).join('|'), 'gi');
    } else {
        pattern = new RegExp(Object.keys(wordData).map(phrase => `\\b${phrase}\\b`).join('|'), 'gi');
    }
        // Replace matched phrases
    translatedText = translatedText.replace(pattern, match => {
        // Get the translation from the wordData, or return the original match if not found
        const translation = wordData[match.toLowerCase()] || match;
        // Apply the original capitalization to the translation
        return applyCasing(match, translation);
    });

    return translatedText;
}


function applyCasing(original, replacement) {
    // optimisaiton - look if the original word is all caps or all lower case first
    original = original.replace(/[^a-zA-Z]/g, ''); //get rid of non-letters because they cause problems
    const isUpper = original === original.toUpperCase();
    const isLower = original === original.toLowerCase();

    if (original.length > 1 && isUpper) { //exclude single letter replacements so the output isn't all caps.
        return replacement.toUpperCase();
    } else if (isLower) {
        return replacement.toLowerCase();
    } else { //have to build the word with capitalisations
        let result = '';
        for (let i = 0; i < replacement.length; i++) { // go over the output characters
            const replaceChar = replacement[i];
            if (i < original.length && original[i] === original[i].toUpperCase()) {
                result += replaceChar.toUpperCase();
            } else {
                result += replaceChar;
            }
        }
        return result;
    }
}


function replaceWordEndings(text, translationKey) {
    const customReplacements = vocabulary.endings[translationKey];
    if (!customReplacements) {
        throw new Error(`No "${translationKey}" word endings available`);
    }
    let modifiedText = text;
    for (const [endingToReplace, replacement] of Object.entries(customReplacements)) {
        const regex = new RegExp(`${endingToReplace}\\b`, 'gi');
        modifiedText = modifiedText.replace(regex, replacement);
    }
    return modifiedText;
}

module.exports = {
  applyStyleToText,
  availableStyles: Object.keys(_compiledStyles),
  replacePhrasesInText,
  replaceWordEndings,
};