/*
HOW TO READ COMMAND FILES:
 - Each command file contains a "group" of commands which fall under a particular umbrella.
   in this case - moderation activities; things server admins can use to keep the server safe and usable.

- the command group is at the top level, named 'mod'
- the subcommands are blocks of code which allocate the names, descriptions, and options for the actual callable commands.
- in discord this appears thusly: /mod kick, /mod ban, /mod masskick.
- /mod CANNOT be called by itself, as a consequence of being subcommanded
- for safety, subcommands with options that require some target should always be required = true

- at the end of the file is the interaction resolver. here, behaviour must be specified for each subcommand (or it will do nothing).
  retrieve the name and input of the interaction using interaction.options methods and go from there.
*/

// see: https://discordjs.guide/slash-commands/advanced-creation.html#option-types for the allowed input types

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Moderation commands') //note: even though this is invisible to the user, it is required by command.tojson
        //Kick Command - removes a single user from the server
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kicks a user from the server.')
                //a user option pops up a list of users, only 1 should be entered and manipulated
                .addUserOption(option => 
                    option.setName('target')
                    .setDescription('User to remove')
                    .setRequired(true)))

        //Masskick Command - used to purge multiple users at a time
        .addSubcommand(subcommand =>
            subcommand
                .setName('masskick')
                .setDescription('Kicks multiple users from the server at once.')
                //a string option will allow all inputs. these need to be resolved appropriately
                .addStringOption(option =>
                    option.setName('targets')
                        .setDescription('User to remove')
                        .setRequired(true)))

        //Ban Command - remove a single user from the server permanently
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Bans a user')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('User to remove')
                        .setRequired(true)))

        //Masskick Command - used to purge multiple users at a time
        .addSubcommand(subcommand =>
            subcommand
                .setName('tempban')
                .setDescription('Kicks multiple users from the server at once.')
                //a string option will allow all inputs. these need to be resolved appropriately
                .addStringOption(option =>
                    option.setName('targets')
                        .setDescription('User to remove')
                        .setRequired(true)))

        //Masskick Command - used to purge multiple users at a time
        .addSubcommand(subcommand =>
            subcommand
                .setName('softban')
                .setDescription('Kicks multiple users from the server at once.')
                //a string option will allow all inputs. these need to be resolved appropriately
                .addStringOption(option =>
                    option.setName('targets')
                        .setDescription('User to remove')
                        .setRequired(true))),

    //Resolve the interaction here - each subcommand requires a different resolution.
    //interaction methods return different things about what happened in the command (i.e. target)
    async execute(interaction) {
        let subc = interaction.options.getSubCommand(); //name of the called command
        switch (subc) {
            case 'kick':
                await interaction.reply('I am ready to work!');
                break;
            case 'masskick':
                await interaction.reply('I am ready to work!');
                break;
            case 'ban':
                await interaction.reply('I am ready to work!');
                break;
            case 'tempban':
                await interaction.reply('I am ready to work!');
                break;
            case 'softban':
                await interaction.reply('I am ready to work!');
                break;
        }
    },
};
