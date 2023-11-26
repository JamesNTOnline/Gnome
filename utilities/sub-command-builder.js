const fs =  require('fs'); //filesystem module
const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require("discord.js");


/**
 * The code in this file is 'pointless':
 * It is possible to simply define all of the attributes of a command and change deploy-commands.js
 * to use the JSON directly instead of using discord.js' builders which then get converted to JSON.
 * So, you can put() JSON. I am doing JSON -> some adjustments using the builders -> put(toJSON).
 * Mostly, this is just an exercise in playing around with the JSON structure to do *stuff* with it,
 * purely for practice, but essentially the code is unnecessary!
 */


/**
 * Builds subcommands from JSON definitions for a given category
 * @param {string} categoryName - The name of the command category to build subcommands for
 * @returns {Array} - An array of subcommand builders
 * @throws {Error} - Error if the named category does not exist in the JSON
 */
function buildCommandsFromJson() {
    const commandsJson = fs.readFileSync('commands.json', 'utf-8'); //get the command definitions
    const commandsData = JSON.parse(commandsJson);
    const commands = {};

    commandsData.forEach(category => {
        // const category = commandsData.find(cat => cat.name === categoryName);
        // if (category) {
        const subcommands = category.subcommands.map(subcommand => {
            //set up the subcommand
            const subcommandBuilder = new SlashCommandSubcommandBuilder()
                .setName(subcommand.name)
                .setDescription(subcommand.description);
            if (subcommand.options) {
                //add each found option onto the subcommand
                subcommand.options.forEach((option) => {
                    switch (option.type) {
                        case 'TEXT':
                            buildTextOption(subcommandBuilder, option);
                            break;
                        case 'INTEGER':
                            buildIntegerOption(subcommandBuilder, option);
                            break;
                        case 'BOOL': //boolean - unused at present
                            break;
                        case 'USER':
                            subcommandBuilder.addUserOption((opt) =>
                                buildSimpleOption(opt, option)
                            );
                            break;
                        case 'CHANNEL': //channel
                            break;
                        case 'ROLE':
                            subcommandBuilder.addRoleOption((opt) =>
                                buildSimpleOption(opt, option)
                            );
                            break;
                        case 'MENTION': //mentionable (users, roles)
                            break;
                        case 'NUM': //number
                            break;
                        case 'ATTACHMENT':
                            subcommandBuilder.addAttachmentOption((opt) =>
                                buildSimpleOption(opt, option)
                            );
                            break;
                        // add cases for other option types discord adds in future
                    }
                });
            }
            return subcommandBuilder;
        });
        // set up the root command
        const { rootCommand, subcommands: subcommandBuilders } = buildCommand(category, subcommands);
        // store both the root command builder and subcommand builders in the data structure
        commands[category.name] = {
            rootCommand: rootCommand,
            subcommands: subcommandBuilders,
        };
    });

    return commands;
}


//         return subcommands;
//     }
//     throw new Error(`Category ${categoryName} not found in JSON`);
// }


/**
 * Builds a root command and appends the subcommands
 * @param {Object} category - The category data from the JSON
 * @param {Array} subcommands - An array of subcommand builders
 * @returns {Object} - An object containing both the root command builder and subcommand builders
 */
function buildCommand(category, subcommands) {
    // set up the root command
    const rootCommandBuilder = new SlashCommandBuilder()
        .setName(category.name)
        .setDescription(category.description)
        .setDMPermission(category.dm || false); // make these commands unavailable in direct messages;

    // add subcommands to the root command
    subcommands.forEach(subcommand => {
        rootCommandBuilder.addSubcommand(subcommand);
    });

    return {
        rootCommand: rootCommandBuilder,
        subcommands: subcommands,
    };
}

/**
 * Sets up the basic information for any option type, that all options must have
 * @param {object} opt - A discord option object to be setup
 * @param {object} option - A representation of an option, containing all of the data to be inserted
 * @returns {object} - A configured discord option
 */
function buildSimpleOption(opt, option) {
    return opt.setName(option.name)
        .setDescription(option.description)
        .setRequired(option.required || false);
}

/**
 * Builds a text option onto a subcommandBuilder
 * @param {object} subcommandBuilder - A discord subcommandBuilder which the option will be attached to
 * @param {object} option - A representation of an option, containing all of the data to be inserted
 */
function buildTextOption(subcommandBuilder, option) {
    subcommandBuilder.addStringOption((opt) => {
        buildSimpleOption(opt, option)
            .setMinLength(option.minLength || 1)
            .setMaxLength(option.maxLength || 2000);
        if (option.autocomplete) {
            opt.setAutocomplete(option.autocomplete);
        }
        if (option.choices && option.choices.length > 0) {
            opt.addChoices(...option.choices);
        }
        return opt;
    });
}

/**
 * Builds an integer option onto a subcommandBuilder
 * @param {object} subcommandBuilder - A discord subcommandBuilder which the option will be attached to
 * @param {object} option - A representation of an option, containing all of the data to be inserted
 */
function buildIntegerOption(subcommandBuilder, option) {
    subcommandBuilder.addIntegerOption((opt) => {
        buildSimpleOption(opt, option)
            .setMinValue(option.minValue || Number.MIN_SAFE_INTEGER)
            .setMaxValue(option.maxValue || Number.MAX_SAFE_INTEGER);
        if (option.choices && option.choices.length > 0) {
            opt.addChoices(...option.choices);
        }
        return opt;
    });
}

const allCommands = buildCommandsFromJson();
module.exports = allCommands;