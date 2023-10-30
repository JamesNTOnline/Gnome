
const { SlashCommandBuilder, SlashCommandSubcommandBuilder, PermissionsBitField } = require('discord.js');
const SubOptionBuilder = require('../utilities/sub-option-builder.js');
const { buildReverseIndex } = require('../utilities/data-manager.js');

//"fonts", characters, and translations
const gTranslate = require('@iamtraction/google-translate');
const styles = require('../utilities/text-styles.json'); //alternate character appearance data
const vocabulary = require('../utilities/phrases.json'); //slang translation data
const emojiWords = require('emojilib'); 
wordEmojis = buildReverseIndex(emojiWords); 

//text translation commands
let jarjar = new SubOptionBuilder('jarjar')
    .addRequiredTextOption()
    .getSubCmd();
let zoomer = new SubOptionBuilder('zoomer') //make a subclass for text-only-commands?
    .addRequiredTextOption()
    .getSubCmd();
let translate = new SubOptionBuilder('translate').getSubCmd();
//text decoration commands
let emojify = new SubOptionBuilder('emojify')
    .addRequiredTextOption()
    .getSubCmd();
let clap = new SubOptionBuilder('clap')
    .addRequiredTextOption()
    .getSubCmd();
let style = new SubOptionBuilder('style')
    .addRequiredTextOption()
    .addSimpleChoices('style', Object.keys(styles))
    .getSubCmd(); //add choices



module.exports = { //exports data in Node.js so it can be require()d in other files
    data: new SlashCommandBuilder()
        .setName('text')
        .setDescription('Transforms some provided text')
        .addSubcommand(jarjar)
        .addSubcommand(zoomer)
        .addSubcommand(translate)
        .addSubcommand(emojify)
        .addSubcommand(clap)
        .addSubcommand(style),

    async execute(interaction) {
        const cmd_name = interaction.options.getSubcommand();
        const text = interaction.options.getString('text') ?? '';
        const style = interaction.options.getString('style') ?? '';
        let editedText = '';
        let pattern;
        
        try{
        await interaction.reply('Beautifying text...');
        switch (cmd_name) { // processing the options
            case 'jarjar':
                editedText = replacePhrasesInText (text, cmd_name);
                editedText = replaceWordEndings(editedText, cmd_name);
                await interaction.editReply(editedText);
                break;
            case 'zoomer':
                editedText = replacePhrasesInText (text, cmd_name, true);
                editedText = replaceWordEndings(editedText, cmd_name);
                await interaction.editReply(editedText); //move this?
                break;
            case 'translate':
                await interaction.editReply('ph');
                break;
            case 'emojify':
                const words = text.split(' ');
                for (const word of words){
                    const emojis = wordEmojis[word]; //get the emojis associated with the word
                    if(emojis){
                        const leftEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        const rightEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        editedText += `${leftEmoji} ${word} ${rightEmoji} `;
                    } else { // no match, just insert a random emoji
                        //const allEmojis = Object.values(wordEmojis).flat();
                        //const randomEmoji = allEmojis[Math.floor(Math.random() * allEmojis.length)];
                        editedText += `${word} `;
                    }
                }
                await interaction.editReply(editedText.trim());
                break;
            case 'clap':
                const emoji = '👏';
                editedText = text.split(' ').join(` ${emoji} `);
                await interaction.editReply(editedText);
                break;
            case 'style':
                editedText = applyStyleToText(text, style);
                await interaction.editReply(editedText);
                break;
        }

    } catch (error) {
    console.error('Error occurred during style command:', error.message);
    await interaction.editReply(`An error occurred while processing the text: ${error.message}`);
}



},


};



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
        console.log(`No vocabulary found for key "${translationKey}"`);
        return text;
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
        throw new Error(`No vocabulary found for key "${translationKey}"`);
        return text;
    }
    let modifiedText = text;
    for (const [endingToReplace, replacement] of Object.entries(customReplacements)) {
        const regex = new RegExp(`${endingToReplace}\\b`, 'gi');
        modifiedText = modifiedText.replace(regex, replacement);
    }
    return modifiedText;
}


function applyStyleToText(text, styleName) {
    if (!styles[styleName]) {
        throw new Error('Style does not exist, see text-styles.json');
    }
    const styleMap = styles[styleName];
    const stylizedText = text.replace(/./g, (char) => styleMap[char] || char);
    return stylizedText;
}

