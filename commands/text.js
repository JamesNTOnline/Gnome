/**
 * TODO: tidy up a bit, additional comments, extra error handling?
 */


const { SlashCommandBuilder, SlashCommandSubcommandBuilder, PermissionsBitField } = require('discord.js');
const { buildReverseIndex } = require('../utilities/data-manager.js');
const allCommands = require('../utilities/sub-command-builder.js');

//"fonts", characters, and translations
const {translate: bingTranslate, lang} = require('bing-translate-api');
const langChoices = Object.values(lang.LANGS).filter(value => value !== 'Auto-detect');
const emojiWords = require('emojilib'); 
const wordEmojis = buildReverseIndex(emojiWords); 
const { replacePhrasesInText, replaceWordEndings, applyStyleToText} = require('./utilities/text-processor.js');
//console.log(langChoices);


module.exports = { //exports data in Node.js so it can be require()d in other files
    data: allCommands['text'].rootCommand,

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