/**
 * add (name, attachment)
 * delete (emoji or name)
 * reactscore (user)
 * display (emoji)
 */

const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require('discord.js');

function buildSubCommand(name, desc) { //this should go into a helper file
    let sub_cmd = new SlashCommandSubcommandBuilder()
        .setName(name)
        .setDescription(desc)
    return sub_cmd;
}

let display_emoji = buildSubCommand('display', 'displays a custom emoji at a bigger size');
let add_emoji = buildSubCommand('add', 'adds an emoji using an attachment');
let del_emoji = buildSubCommand('delete', 'deletes an emoji from the emoji list');
let react_score = buildSubCommand('score', 'shows the reaction score for a user');


module.exports = { //exports data in Node.js so it can be require()d in other files
    data: new SlashCommandBuilder()
        .setName('emoji')
        .setDescription('manipulate and retrieve information about emojis')
        .addSubcommand(display_emoji
            .addStringOption(option =>
                option.setName('emoji')
                    .setDescription('the emoji to display')
                    .setRequired(true)))
        .addSubcommand(add_emoji
            .addAttachmentOption(option =>
                option.setName('attachment')
                    .setDescription('image attachment to add as an emoji')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('tag for the new emoji')
                    .setRequired(true)))
        .addSubcommand(del_emoji
            .addStringOption(option =>
                option.setName('emoji')
                    .setDescription('the emoji to be deleted from this server')
                    .setRequired(true)))
        .addSubcommand(react_score
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
        }
    },
};
