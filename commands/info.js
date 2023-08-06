/**
 * @todo - display avatar
 * @todo - display profile
 * @todo - display timeouts
 * @todo - display bot status (ping)
*/


const { SlashCommandBuilder } = require('discord.js');

//https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses

module.exports = { //exports data in Node.js so it can be require()d in other files
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Displays some information about something in the server'),
    async execute(interaction){
        await interaction.reply('ph');
    },
};




// const { SlashCommandBuilder } = require('discord.js');

// //https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses

// module.exports = { //exports data in Node.js so it can be require()d in other files
//     data: new SlashCommandBuilder()
//         .setName('ping')
//         .setDescription('Replies to let you know the bot is active'),
//     async execute(interaction){
//         await interaction.reply('I am ready to work!');
//     },
// };

// const { SlashCommandBuilder } = require('discord.js');

// //https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses

// module.exports = { //exports data in Node.js so it can be require()d in other files
//     data: new SlashCommandBuilder()
//         .setName('echo')
//         .setDescription('Repeats a phrase back to you'),
//     async execute(interaction){
//         await interaction.reply('Placeholder');
//     },
// };
