/**
 * @todo add (name, attachment)
 * @todo delete (emoji or name)
 * @todo reactscore (user)
 * @todo display (emoji)
 */

const { SlashCommandBuilder, SlashCommandSubcommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const SubOptionBuilder = require('../utilities/sub-option-builder.js');

let displayEmoji = new SubOptionBuilder('display')
    .getSubCmd();
let addEmoji = new SubOptionBuilder('add')
    .getSubCmd();
let delEmoji = new SubOptionBuilder('delete')
    .getSubCmd();
let reactScore = new SubOptionBuilder('score') //shoulg go into info?
    .getSubCmd();


module.exports = { //exports data in Node.js so it can be require()d in other files
    data: new SlashCommandBuilder()
        .setName('emoji')
        .setDescription('manipulate and retrieve information about emojis')
        .addSubcommand(displayEmoji
            .addStringOption(option =>
                option.setName('emoji')
                    .setDescription('the emoji to display')
                    .setRequired(true)))
        .addSubcommand(addEmoji
            .addAttachmentOption(option =>
                option.setName('attachment')
                    .setDescription('image attachment to add as an emoji')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('tag for the new emoji')
                    .setRequired(true)))
        .addSubcommand(delEmoji
            .addStringOption(option =>
                option.setName('emoji')
                    .setDescription('the emoji to be deleted from this server')
                    .setRequired(true)))
        .addSubcommand(reactScore
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('who to check the reaction score for')
                    .setRequired(true))),

    //https://stackoverflow.com/questions/64053658/get-emojis-from-message-discord-js-v12
    async execute(interaction) {
        const cmd_name = interaction.options.getSubcommand();
        const EMOJIREGEX = /<a*:.+:(\d+)>/gm;
        switch (cmd_name) {
            case 'display': //needs some error handling
                const toDisplay = interaction.options.getString('emoji');
                console.log(toDisplay);
                const match = EMOJIREGEX.exec(toDisplay);
                console.log(match[1]);
                if (match) {
                    const emoji = interaction.guild.emojis.cache.get(match[1]);
                    await interaction.reply(emoji.url);
                }
                break;
            case 'add': 
                break;
            case 'delete':
                break;
            case 'score':
                break;
        }
    },
};
