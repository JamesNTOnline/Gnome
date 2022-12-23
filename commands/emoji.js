/**
 * add (name, attachment)
 * delete (emoji or name)
 * reactscore (user)
 * display (emoji)
 */

const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require('discord.js');

function buildSubCommand(name, desc) {
    let sub_cmd = new SlashCommandSubcommandBuilder()
        .setName(name)
        .setDescription(desc)
    return sub_cmd;
}

let display = buildSubCommand('display', 'displays a custom emoji at a bigger size.')

module.exports = { //exports data in Node.js so it can be require()d in other files
    data: new SlashCommandBuilder()
        .setName('emoji')
        .setDescription('manipulate and retrieve information about emojis')
        .addSubcommand(display
            .addStringOption(option =>
                option.setName('emoji')
                    .setDescription('the emoji to display')
                    .setRequired(true)
            )),



//https://stackoverflow.com/questions/64053658/get-emojis-from-message-discord-js-v12
    async execute(interaction) {
        const cmd_name = interaction.options.getSubcommand();
        const EMOJIREGEX = /<a*:.+:(\d+)>/gm;
        switch (cmd_name) {
            case 'display':
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
