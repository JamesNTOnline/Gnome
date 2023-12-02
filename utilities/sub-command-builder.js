const fs =  require('fs'); //filesystem module
const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require("discord.js");


/** DFN
 * The code in this file is mostly unnecessary and just for practice:
 * It is possible to define all of the attributes of a command and change deploy-commands.js
 * to put() the JSON directly instead of using discord.js' builders which then need to be converted to JSON.
 * 
 * The builder classes are ostensibly supposed to be easier to manage by treating commands like objects,
 * however, it results in quite a lot of duplicate code; refactoring which, results in additional classes/modules
 * see: sub-option.builder.js, and it quickly becomes a decentralised mess (in my opinion!)
 * For example: a command with 6 subcommands needs 1 commandbuilder and 6 subcommandbuilders.
 * 
 * Here I am writing JSON -> parsing this into the builders with methods here -> sending the builders to JSON again.
 * Mostly, I did this as an exercise in manipulating JSON to do *stuff*, purely for practice, 
 * but essentially meaning most of this code is unnecessary!
 */


/**
 * Builds full commands from JSON definitions.
 * @returns {Object} - An object containing root commands and subcommands keyed by category name.
 *                    Each entry has a `rootCommand` builder and `subcommands` array of subcommand builders.
 *                    The subcommands can thus be accessed (and modified) individually later if needed.
 */
function buildCommandsFromJson() {
    const commandsJson = fs.readFileSync('commands.json', 'utf-8'); //get the command definitions
    const commandsData = JSON.parse(commandsJson);
    const commands = {}; //list of root commands

    commandsData.forEach(category => {
        const subcommands = category.subcommands.map(subcommand => {
            const subcommandBuilder = new SlashCommandSubcommandBuilder() //base command
                .setName(subcommand.name)
                .setDescription(subcommand.description);
            if (subcommand.options) {
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
        // set up the root command and add its subcommands
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
    console.log(rootCommandBuilder);
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