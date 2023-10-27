
const { SlashCommandBuilder, SlashCommandSubcommandBuilder, PermissionsBitField } = require('discord.js');
const SubOptionBuilder = require('../utilities/sub-option-builder.js');
const { buildReverseIndex } = require('../utilities/data-manager.js');

//"fonts", characters, and translations
const googleTranslate = require('@iamtraction/google-translate');
const styles = require('../utilities/text-styles.json'); //alternate character appearance data
const vocabulary = require('../utilities/phrases.json'); //slang translation data
const emojiPhrases = require("emojilib"); 
phraseEmojis = buildReverseIndex(emojiPhrases); 

//text translation commands

let emojify = new SubOptionBuilder('emojify')
    .addRequiredTextOption()
    .getSubCmd();
let cuteify = new SubOptionBuilder('cuteify').getSubCmd();
let jarjar = new SubOptionBuilder('jarjar')
    .addRequiredTextOption()
    .getSubCmd();
let zoomer = new SubOptionBuilder('zoomer') //make a subclass for text-only-commands?
    .addRequiredTextOption()
    .getSubCmd();
let random = new SubOptionBuilder('random').getSubCmd();
let clap = new SubOptionBuilder('clap').getSubCmd();
let style = new SubOptionBuilder('style')
    .addRequiredTextOption()
    .addSimpleChoices('style', Object.keys(styles))
    .getSubCmd(); //add choices
let translate = new SubOptionBuilder('translate').getSubCmd();



module.exports = { //exports data in Node.js so it can be require()d in other files
    data: new SlashCommandBuilder()
        .setName('text')
        .setDescription('Transforms some provided text')
        .addSubcommand(style)
        .addSubcommand(jarjar)
        .addSubcommand(zoomer),

    async execute(interaction) {
        const cmd_name = interaction.options.getSubcommand();
        const text = interaction.options.getString('text') ?? "";
        const style = interaction.options.getString('style') ?? "";
        let editedText = "";
        let pattern;
        
        try{
        await interaction.reply('Beautifying text...');
        switch (cmd_name) { // processing the options
            case "emojify":
                await interaction.reply('ph');
                break;
            case "cuteify":
                await interaction.reply('ph');
                break;
            case "jarjar":
                // try {
                // await interaction.reply('Beautifying text...');
                // const text = interaction.options.getString('text');
                //pattern = new RegExp(Object.keys(wordData).map(phrase => `\\b${phrase}\\b`).join('|'), 'gi');
                editedText = replacePhrasesInText (text, cmd_name);
                editedText = replaceWordEndings(editedText, cmd_name);
                await interaction.editReply(editedText);
                // } catch (error){
                //     console.error('Error occurred during style command:', error.message);
                //     await interaction.editReply('An error occurred while processing the style command.');
                // }
                break;
            case "zoomer":
                //pattern = new RegExp(Object.keys(wordData).join('|'), 'gi');
                editedText = replacePhrasesInText (text, cmd_name, true);
                editedText = replaceWordEndings(editedText, cmd_name);
                await interaction.editReply(editedText); //move this?
                break;
            case "random":
                await interaction.reply('ph');
                break;
            case "clap":
                await interaction.reply('ph');
                break;
            case "style":
                // try {
                    //await interaction.reply('Beautifying text...')
                    // const style = interaction.options.getString('style');
                    editedText = applyStyleToText(text, style);
                    await interaction.editReply(editedText);
                // } catch (error) {
                //     console.error('Error occurred during style command:', error.message);
                //     await interaction.editReply('An error occurred while processing the style command.');
                // }
                break;
            case "translate":
                await interaction.reply('ph');
                break;
        }

    } catch (error) {
    console.error('Error occurred during style command:', error.message);
    await interaction.editReply('An error occurred while processing the style command.');
}



},


};



/**
 * Matches phrases in the 
 * @param {string} text - The input text to be processed.
 * @param {string} translationKey - The key used to access the translation data from the vocabulary.
 * @param {boolean} allowPartials - A flag to indicate whether partial matching is allowed.
 * @returns {string} The text with phrases replaced according to the specified translation.
 */
function replacePhrasesInText(text, translationKey, allowPartials = false) {
    const wordData = vocabulary[translationKey];
    let pattern;
    if (!wordData) {
        console.log(`No vocabulary found for key "${translationKey}"`);
        return text;
    }
    let translatedText = text;

    // Create a regular expression pattern for matching all phrases
    // uses the | (OR) operator to match any specified phrase
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
        console.log(`No vocabulary found for key "${translationKey}"`);
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

