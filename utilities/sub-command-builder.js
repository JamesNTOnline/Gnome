const fs = require('fs'); 
const path = require('path');
const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require("discord.js");


/** DFN
 * the code in this file is mostly unnecessary and just for practice:
 * it is possible to define all of the attributes of a command and change deploy-commands.js
 * to put() the JSON directly instead of using discord.js' builders which then need to be converted to JSON.
 * 
 * the builder classes are supposed to be easier to manage by treating commands like objects,
 * however, it results in quite a lot of duplicate code; refactoring which, results in additional classes/modules
 * see: sub-option.builder.js, and it quickly becomes a decentralised mess (in my opinion!)
 * for example: a command with 6 subcommands needs 1 commandbuilder and 6 subcommandbuilders.
 * 
 * here I am writing JSON -> parsing this into the builders with methods here -> sending the builders to JSON again.
 * mostly, I did this as an exercise in manipulating JSON and understanding how discord sees commands
 */


/**
 * builds full commands from JSON definitions.
 * @returns {Object} - an object containing root commands and subcommands keyed by category name.
 *                    each entry has a `rootCommand` builder and `subcommands` array of subcommand builders.
 *                    the subcommands can thus be accessed (and modified) individually later if needed.
 */
function buildCommandsFromJson() {
    //look for and read files in the command schemas directory
    const schemasDir = path.resolve(__dirname, '..', 'commands', 'schemas');
    if (!fs.existsSync(schemasDir) || !fs.statSync(schemasDir).isDirectory()) {
        throw new Error(`no command schemas found. Expected JSON files under ${schemasDir}`);
    }
    const files = fs.readdirSync(schemasDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
        throw new Error(`no .json files found in ${schemasDir}`);
    }
    // build a combined list of all command categories from all JSON files
    const commandsData = [];
    for (const file of files) {
        const full = path.join(schemasDir, file);
        try {
            const raw = fs.readFileSync(full, 'utf8');
            if (!raw || !raw.trim()) {
                console.warn(`Skipping empty schema file: ${file}`);
                continue; // skip empty files
            }
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) commandsData.push(...parsed);
            else commandsData.push(parsed);
        } catch (err) {
            console.error(`failed to read/parse ${file}:`, err);
            // continue on error rather than aborting the whole build
            continue;
        }
    }

    if (commandsData.length === 0) {
        throw new Error(`no valid schemas found under ${schemasDir}`);
    }
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
                        case 'BOOL': 
                            break;
                        case 'USER':
                            subcommandBuilder.addUserOption((opt) =>
                                buildSimpleOption(opt, option)
                            );
                            break;
                        case 'CHANNEL': 
                            break;
                        case 'ROLE':
                            subcommandBuilder.addRoleOption((opt) =>
                                buildSimpleOption(opt, option)
                            );
                            break;
                        case 'MENTION': //mentionable (users, roles)
                            break;
                        case 'NUM': 
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


/**
 * builds a root command and appends the subcommands
 * @param {Object} category - the category data from the JSON
 * @param {Array} subcommands - an array of subcommand builders
 * @returns {Object} - an object containing both the root command builder and subcommand builders
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
 * sets up the basic information for any option type, that all options must have
 * @param {object} opt - a discord option object to be setup
 * @param {object} option - a representation of an option, containing all of the data to be inserted
 * @returns {object} - a configured discord option
 */
function buildSimpleOption(opt, option) {
    return opt.setName(option.name)
        .setDescription(option.description)
        .setRequired(option.required || false);
}

/**
 * builds a text option onto a subcommandBuilder
 * @param {object} subcommandBuilder - a discord subcommandBuilder which the option will be attached to
 * @param {object} option - a representation of an option, containing all of the data to be inserted
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
 * builds an integer option onto a subcommandBuilder
 * @param {object} subcommandBuilder - a discord subcommandBuilder which the option will be attached to
 * @param {object} option - a representation of an option, containing all of the data to be inserted
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