const fs =  require('fs'); //filesystem module
const { SlashCommandSubcommandBuilder } = require("discord.js");


function buildSubcommandsFromJson(categoryName) {
    // Read the contents of the commands.json file
    const commandsJson = fs.readFileSync('commands.json', 'utf-8');
    const commandsData = JSON.parse(commandsJson);

    // Find the specified category
    const category = commandsData.find(cat => cat.name === categoryName);

    if (category) {
        // Build subcommands for the category
        const subcommands = category.subcommands.map(subcommand => {

            const subcommandBuilder = new SlashCommandSubcommandBuilder()
                .setName(subcommand.name)
                .setDescription(subcommand.description);
            if (subcommand.options) {
                subcommand.options.forEach((option) => {
                    const simpleOption = (opt) => { //sets up attributes shared by all options
                        opt.setName(option.name)
                            .setDescription(option.description)
                            .setRequired(option.required || false);
                        return opt; // Add this line
                    };
                    switch (option.type) {
                        case 'TEXT':
                            subcommandBuilder.addStringOption((opt) => {
                                simpleOption(opt)
                                    .setMinLength(option.minLength || 1)
                                    .setMaxLength(option.maxLength || 2000);
                                if (option.autocomplete) {
                                    opt.setAutocomplete(option.autocomplete);
                                }

                                if (option.choices && option.choices.length > 0) {
                                    // Example: If choices are provided, add them to the option
                                    subcommandBuilder.addChoices(...option.choices);
                                }
                                return opt;
                            });
                            break;
                        case 'INTEGER':
                            subcommandBuilder.addIntegerOption((opt) => {
                                opt = simpleOption(opt)
                                    .setMinValue(option.minValue)
                                    .setMaxValue(option.maxValue);

                                if (option.choices && option.choices.length > 0) {
                                    opt.addChoices(...option.choices);
                                }

                                return opt;
                            });
                            break;
                        case 'BOOL': //boolean
                            break;
                        case 'USER':
                            subcommandBuilder.addUserOption((opt) =>
                                simpleOption(opt)
                            );
                            break;
                        case 'CHANNEL': //channel
                            break;
                        case 'ROLE':
                            subcommandBuilder.addRoleOption((opt) =>
                                simpleOption(opt)
                            );
                            break;
                        case 'MENTION': //mentionable (users, roles)
                            break;
                        case 'NUM': //number
                            break;
                        case 'ATTACHMENT':
                            subcommandBuilder.addFileOption((opt) =>
                                simpleOption(opt)
                            );
                            break;
                        // add cases for other option types discord adds in future
                    }
                });
            }
            return subcommandBuilder;
        });
        return subcommands;
    }
    throw new Error(`Category ${categoryName} not found in JSON`);
}

module.exports = buildSubcommandsFromJson;