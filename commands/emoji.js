/**
 * @todo add (name, attachment)
 * @todo delete (emoji or name)
 * @todo reactscore (user)
 * @todo display (emoji)
 */

const { SlashCommandBuilder, SlashCommandSubcommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const allCommands = require('../utilities/sub-command-builder.js');


module.exports = { //exports data in Node.js so it can be require()d in other files
    data: allCommands['emoji'].rootCommand,

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
