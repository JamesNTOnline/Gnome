/**
 * TODO: tidy up a bit, additional comments, extra error handling?
 */


const { SlashCommandBuilder, SlashCommandSubcommandBuilder, PermissionsBitField } = require('discord.js');
const SubOptionBuilder = require('../utilities/sub-option-builder.js');
const { buildReverseIndex } = require('../utilities/data-manager.js');

//"fonts", characters, and translations
const {translate: bingTranslate, lang} = require('bing-translate-api');
const langChoices = Object.values(lang.LANGS).filter(value => value !== 'Auto-detect');
const styles = require('../utilities/text-styles.json'); //alternate character appearance data
const vocabulary = require('../utilities/phrases.json'); //slang translation data
const emojiWords = require('emojilib'); 
wordEmojis = buildReverseIndex(emojiWords); 

console.log(langChoices);

// Update choices for the "style" option under "aesthetic"
//jsonStructure.subcommands.find(sub => sub.name === 'aesthetic').options.find(opt => opt.name === 'style').choices = Object.keys(styles).map(choice => ({ name: choice, value: choice }));

// Now jsonStructure is updated with choices from text-styles.json
//console.log(JSON.stringify(jsonStructure, null, 2));

//text translation commands
let jarjar = new SubOptionBuilder('jarjar')
    .addRequiredTextOption()
    .getSubCmd();
let zoomer = new SubOptionBuilder('zoomer') //make a subclass for text-only-commands?
    .addRequiredTextOption()
    .getSubCmd();
let translate = new SubOptionBuilder('translate')
    .addRequiredTextOption()
    .getSubCmd()
    .addStringOption(option =>
        option.setName('language')
            .setDescription('What language to output')
        .setAutocomplete(true)
        .setRequired(true));
//text decoration commands
let emojify = new SubOptionBuilder('emojify')
    .addRequiredTextOption()
    .getSubCmd();
let clap = new SubOptionBuilder('clap')
    .addRequiredTextOption()
    .getSubCmd();
let style = new SubOptionBuilder('aesthetic')
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

    async autocomplete(interaction) { //deal here with updating the UI as a user types
        const focusedOption = interaction.options.getFocused(true);
        let choices ;

        if (focusedOption.name === 'language') {
            choices = langChoices;
        }
        // show an initial 25 options; input starts empty
        let input = focusedOption.value;
        if (input === '') {
            await interaction.respond(
                choices.slice(0, 25).map(choice => ({ name: choice, value: choice }))
            );
        } else {
            // string checking needed here 
            const filtered = choices.filter(choice => typeof choice === 'string' && choice.toLowerCase().startsWith(input));
            const updatedChoices = filtered.slice(0, 25); // Display up to 25 filtered choices

            await interaction.respond( //update the choice list
                updatedChoices.map(choice => ({ name: choice, value: choice.toLowerCase() }))
            );
        }
    },
    async execute(interaction) { //deals with what happens when the user pushes 'enter'
        const cmd_name = interaction.options.getSubcommand();
        const text = interaction.options.getString('text') ?? '';
        const choice = interaction.options.getString('style') ?? interaction.options.getString('language') ?? '';
        let editedText = '';
        let pattern;

        try {
            await interaction.reply('Beautifying text...');
            switch (cmd_name) { // processing the options
                case 'jarjar':
                    editedText = replacePhrasesInText(text, cmd_name);
                    editedText = replaceWordEndings(editedText, cmd_name);
                    await interaction.editReply(editedText);
                    break;
                case 'zoomer':
                    editedText = replacePhrasesInText(text, cmd_name, true);
                    editedText = replaceWordEndings(editedText, cmd_name);
                    await interaction.editReply(editedText); //move this?
                    break;
                case 'translate':
                    editedText = await bingTranslate(text, null, choice);
                    await interaction.editReply(editedText.translation)
                    break;
                case 'emojify':
                    const words = text.split(' ');
                    for (const word of words) {
                        const emojis = wordEmojis[word]; //get the emojis associated with the word
                        if (emojis) {
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
                    editedText = applyStyleToText(text, choice);
                    await interaction.editReply(editedText);
                    break;
            }

        } catch (error) {
            console.error('Error processing the text:', error.message);
            await interaction.editReply(`Couldn't process the text`);
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


function applyStyleToText(text, styleName) {
    if (!styles[styleName]) {
        throw new Error('This style is not available');
    }
    const styleMap = styles[styleName];
    const stylizedText = text.replace(/./g, (char) => styleMap[char] || char);
    return stylizedText;
}

