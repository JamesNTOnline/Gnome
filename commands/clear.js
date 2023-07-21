/**
 * @todo - command which removes all nicknames
 * @todo - command to list timeouts
 * @todo - command to remove all timeouts
 * @todo - command to remove a role from users
 * @todo - command to purge messages
 * @todo - command to remove emojis from messages
 * 
*/
const { SlashCommandBuilder, SlashCommandSubcommandBuilder, PermissionsBitField} = require('discord.js');
const SubOptionBuilder = require('../builders/sub-option-builder');


let timeouts = new SubOptionBuilder('timeouts').getSubCmd();
let nicknames = new SubOptionBuilder('nicknames').getSubCmd();
let bans = new SubOptionBuilder('bans').getSubCmd();
let reactions = new SubOptionBuilder('reactions').getSubCmd();
let messages = new SubOptionBuilder('messages').getSubCmd()
    .addNumberOption(option =>
        option.setName('amount')
            .setDescription('The number of messages to delete')
            .setMaxValue(50)
            .setMinValue(1)
            .setRequired(false));


module.exports = { 
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('[PH]')
        .addSubcommand(timeouts)
        .addSubcommand(nicknames)
        .addSubcommand(bans)
        .addSubcommand(reactions)
        .addSubcommand(messages),

    async execute(interaction) {
        const cmdName = interaction.options.getSubcommand();
        const user_perms = interaction.member.permissions;
        if (user_perms.has(PermissionsBitField.Flags.Administrator)) {
            switch (cmdName) {
                /**
                 * discord does not provide a way to directly get the timeout list
                 * idea: look at the properties of the users and filter them before manipulating them
                 */
                case 'timeouts':
                    //anon filter function
                    const timeoutFilter = (member) => member.communicationDisabledUntilTimestamp > 0;
                    processMembers(cmdName, interaction, timeoutFilter, async (member) => {
                        // Discord API function to apply a null timeout (removes timeout)
                        await member.timeout(null);
                    });
                    break;
                // interaction.guild.members.fetch()
                //     .then(async members => {
                //         // Filter to members that have communication disabled
                //         const disabledMembers = members.filter(member => member.communicationDisabledUntilTimestamp > 0);
                //         const totalCount = disabledMembers.size;

                //         await interaction.reply(`Clearing ${cmdName} from 0/${totalCount} members...`);

                //         let count = 0;
                //         for (const member of disabledMembers.values()) {
                //             try {
                //                 await member.timeout(null);
                //                 count++;
                //                 await interaction.editReply(`Cleared ${cmdName} from ${count}/${totalCount} members...`);
                //             } catch (err) {
                //                 // Handle any errors that occur during the timeout process for a member
                //                 console.error(`Error clearing ${cmdName.slice(0, -1)} for member ${member.user.tag}:`, err);
                //             }
                //         }

                //         await interaction.followUp(`${cmdName.charAt(0).toUpperCase()} cleared!`);
                //     })
                //     .catch(err => {
                //         interaction.deleteReply();
                //         interaction.followUp('Something went wrong, check audit log');
                //         console.error(err);
                //     });
                // break;

                // try {
                //     let members = await interaction.guild.members.fetch();
                //     let count = 0;
                //     // Filter to members that have communication disabled
                //     members = members.filter(member => member.communicationDisabledUntilTimestamp > 0);
                //     await interaction.reply(`Clearing timeouts from ${count}/${members.size} members...`);
                //     for (const member of members.values()) {
                //         // Check permissions else remove timeout
                //         try {
                //             await member.timeout(null);
                //             count++;
                //             await interaction.editReply(`Cleared timeouts from ${count}/${members.size} members...`);
                //         } catch (err) {
                //             // Handle any errors that occur during the timeout process for a member
                //             console.error(`Error clearing timeout for member ${member.user.tag}:`, err);
                //         }
                //     }
                //     await interaction.followUp('Timeouts cleared!');
                // } catch (err) {
                //     await interaction.deleteReply();
                //     await interaction.followUp('Something went wrong, check audit log');
                //     console.error(err);
                // }
                // break;
                case 'nicknames':
                    //anon filter function
                    const nickFilter = (member) => member.nickname !== null;
                    processMembers(cmdName, interaction, nickFilter, async (member) => {
                        // Discord API function to apply a null timeout (removes timeout)
                        await member.setNickname(null);
                    });
                    break;
                //     interaction.guild.members.fetch()
                //     .then(async members => {
                //         // Filter to members that have communication disabled
                //         const namedMembers = members.filter(member => member.nickname !== null);
                //         const totalCount = namedMembers.size;

                //         await interaction.reply(`Clearing ${cmdName} from 0/${totalCount} members...`);

                //         let count = 0;
                //         for (const member of namedMembers.values()) {
                //             try {
                //                 await member.setNickname(null);
                //                 count++;
                //                 await interaction.editReply(`Cleared ${cmdName} from ${count}/${totalCount} members...`);
                //             } catch (err) {
                //                 // Handle any errors that occur during the timeout process for a member
                //                 console.error(`Error clearing ${cmdName.slice(0, -1)} for member ${member.user.tag}:`, err);
                //             }
                //         }

                //         await interaction.followUp(`${cmdName.charAt(0).toUpperCase()} cleared!`);
                //     })
                //     .catch(err => {
                //         interaction.deleteReply();
                //         interaction.followUp('Something went wrong, check audit log');
                //         console.error(err);
                //     });
                // break;
                case 'bans':
                    const blueSquareEmoji = ':blue_square:';
                    await interaction.reply('Starting to clear the ban list\n[                              ]')
                        .then(async () => { //allows using await to do sequential async functions
                            const bans = await interaction.guild.bans.fetch();
                            const banCount = bans.size;
                            if (banCount === 0) {
                                return interaction.editReply('No members are banned in this server.');
                            }
                            let counter = 0;
                            for (const ban of bans.values()) {
                                await interaction.guild.members.unban(ban.user);
                                counter++;
                                const interval = Math.floor(bans.size / 6); // Calculate the interval for replacing spaces with a blue square
                                if (interval > 0 && counter % interval === 0) {
                                    const blueSquareCount = Math.floor(counter / interval);
                                    const spaceCount = 6 - (blueSquareCount % 6);
                                    const modifiedMessage = `[${blueSquareEmoji.repeat(blueSquareCount)}${'      '.repeat(spaceCount)}]`;
                                    await interaction.editReply(modifiedMessage);
                                }
                            }
                        })
                        .catch(err => {
                            console.error(err);
                            interaction.editReply('An error occurred while processing the command.');
                        });
                    break;
                case 'reactions':
                    //
                    break;
                case 'messages':
                    //
                    break;


            }
        }
    },
};


async function processMembers(cmdName, interaction, filterCondition, functionToCall) {
    try {
      const members = await interaction.guild.members.fetch();
      // Filter members based on the provided filter condition
      const targetMembers = members.filter(filterCondition);
  
      const totalCount = targetMembers.size;
      await interaction.reply(`Processing ${cmdName} for 0/${totalCount} members...`);
  
      let count = 0;
      for (const member of targetMembers.values()) {
        try {
          await functionToCall(member);
          count++;
          await interaction.editReply(`Processed ${cmdName} for ${count}/${totalCount} members...`);
        } catch (err) {
          console.error(`Error during processing ${cmdName} for member ${member.user.tag}:`, err);
        }
      }
  
      await interaction.followUp(`${cmdName.charAt(0).toUpperCase() + cmdName.slice(1)} cleared!`);
    } catch (err) {
      interaction.deleteReply();
      interaction.followUp('Something went wrong, check audit log');
      console.error(err);
    }
  }