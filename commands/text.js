

const { SlashCommandBuilder, SlashCommandSubcommandBuilder, PermissionsBitField } = require('discord.js');
const SubOptionBuilder = require('../utilities/sub-option-builder');
const { buildReverseIndex } = require('../utilities/data-manager.js');
//font and character libraries
const styles = require('../utilities/text-styles.json'); //discord doesn't allow "true" fonts, but you can add the character mappings in this file
const vocab = require('../utilities/words.json');
const emojiPhraseData = require("emojilib");
phraseEmojiData = buildReverseIndex(emojiPhraseData);

//text translation commands
let emojify = new SubOptionBuilder('emojify').getSubCmd();
let cuteify = new SubOptionBuilder('cuteify').getSubCmd();
let jarjar = new SubOptionBuilder('jarjar')
    .addRequiredTextOption()
    .getSubCmd();
let zoomify = new SubOptionBuilder('zoomify').getSubCmd();
let random = new SubOptionBuilder('random').getSubCmd();
let clap = new SubOptionBuilder('clap').getSubCmd();
let style = new SubOptionBuilder('style')
    .addRequiredTextOption()
    .addSimpleChoices('style', Object.keys(styles))
    .getSubCmd(); //add choices
let translate = new SubOptionBuilder('translate').getSubCmd();


//https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses

module.exports = { //exports data in Node.js so it can be require()d in other files
    data: new SlashCommandBuilder()
        .setName('text')
        .setDescription('Transforms some provided text')
        .addSubcommand(style)
        .addSubcommand(jarjar),

    async execute(interaction) {
        const cmd_name = interaction.options.getSubcommand();
        const text = interaction.options.getString('text');
        let editedText = "";
        switch (cmd_name) { // processing the options
            case "emojify":
                await interaction.reply('ph');
                break;
            case "cuteify":
                await interaction.reply('ph');
                break;
            case "jarjar":
                try {
                    await interaction.reply('Beautifying text...');
                    const text = interaction.options.getString('text');
                    let editedText = replaceWordsInText(text, 'jarjar');
                    editedText = replaceWordEndings(editedText, 'jarjar');
                    await interaction.editReply(editedText);
                } catch (error){
                    console.error('Error occurred during style command:', error.message);
                    await interaction.editReply('An error occurred while processing the style command.');
                }
                break;
            case "zoomify":
                await interaction.reply('ph');
                break;
            case "random":
                await interaction.reply('ph');
                break;
            case "clap":
                await interaction.reply('ph');
                break;
            case "style":
                try {
                    await interaction.reply('Beautifying text...')
                    const style = interaction.options.getString('style');
                    editedText = applyStyleToText(text, style);
                    await interaction.editReply(editedText);
                } catch (error) {
                    console.error('Error occurred during style command:', error.message);
                    await interaction.editReply('An error occurred while processing the style command.');
                }
                break;
            case "translate":
                await interaction.reply('ph');
                break;
        }
    },


};


function replaceWordsInText(text, translationKey) {
    const wordData = vocab[translationKey];
    if (!wordData) {
        console.log(`No vocabulary found for key "${translationKey}"`);
        return text;
    }
    let translatedText = text;

    // Create a regular expression pattern for matching all phrases
    // uses the | (OR) operator to match any specified phrase
    const pattern = new RegExp(Object.keys(wordData).map(phrase => `\\b${phrase}\\b`).join('|'), 'gi');

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
    const isUpper = original === original.toUpperCase();
    const isLower = original === original.toLowerCase();

    if (isUpper) {
        return replacement.toUpperCase();
    } else if (isLower) {
        return replacement.toLowerCase();
    } else { //have to build the word with capitalisations
        let result = '';
        for (let i = 0; i < original.length; i++) {
            const replaceChar = replacement[i] || '';
            if (original[i] === original[i].toUpperCase()) {
                result += replaceChar.toUpperCase();
            } else {
                result += replaceChar;
            }
        }
        return result;
    }
}


function replaceWordEndings(text, translationKey) {
    const customReplacements = vocab.endings[translationKey];
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

