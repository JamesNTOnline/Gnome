const { SlashCommandSubcommandBuilder } = require("discord.js");
const commandRegistry = require('../command-registry.js');

/**
 * I have a different idea for how to handle this. More of a long-term/if the project gets larger goal
 * I want to make the api function calls dynamic and simply store every each command and its options as json
 * This would make setting up a subcommand object as simple as adding it to the json file, but means rewriting some of the existing code
 * tl;dr: @todo change how command setup works
 */


function buildSubcommandFromJson(subcommandData) {
    const subcommandBuilder = new SlashCommandSubcommandBuilder()
        .setName(subcommandData.name)
        .setDescription(subcommandData.description);
    if (subcommandData.options) {
        subcommandData.options.forEach((option) => {
            const basicOption = (opt) => //sets up attributes shared by all options
                opt.setName(option.name)
                    .setDescription(option.description)
                    .setRequired(option.required || false);
            switch (option.type) {
                case 'TEXT':
                    subcommandBuilder.addStringOption((opt) =>
                        basicOption(opt)
                            .setMinLength(option.minLength || 1)
                            .setMaxLength(option.maxLength || 2000)
                    );
                    if (option.autocomplete) {
                        subcommandBuilder.setAutocomplete(option.autocomplete);
                    }

                    if (option.choices && option.choices.length > 0) {
                        // Example: If choices are provided, add them to the option
                        subcommandBuilder.addChoices(option.choices);
                    }
                    break;
                case 'INTEGER':
                    subcommandBuilder.addIntegerOption((opt) =>
                        basicOption(opt)
                            .setMin(option.minValue)
                            .setMax(option.maxValue)
                    );

                    if (option.choices && option.choices.length > 0) { //repeated code
                        subcommandBuilder.addChoices(option.choices);
                    }
                    break;
                case 'BOOL': //boolean
                    break;
                case 'USER':
                    subcommandBuilder.addUserOption((opt) =>
                        basicOption(opt)
                    );
                    break;
                case 'CHANNEL': //channel
                    break;
                case 'ROLE':
                    subcommandBuilder.addRoleOption((opt) =>
                        basicOption(opt)
                    );
                    break;
                case 'MENTION': //mentionable (users, roles)
                    break;
                case 'NUM': //number
                    break;
                case 'ATTACHMENT':
                    subcommandBuilder.addFileOption((opt) =>
                        basicOption(opt)
                    );
                    break;
    // add cases for other option types discord adds in future
            }
        });
    }
    return subcommandBuilder;
}


/**
 * Use this class and its methods to add options onto a subcommand
 */
class SubOptionBuilder {
    #builderName //dont think this is needed. builder has properties.
    #builderDesc 
    #builder

    constructor(name, description) {
        this.#builderName  = name; //# - private
        this.#builderDesc = commandRegistry.getDescription(name);
        this.#builder = new SlashCommandSubcommandBuilder()
            .setName(name)
            .setDescription(this.#builderDesc );
    }


    /**
     * Adds a target and reason to the subcommand. typically mod commands always want this, but other commands dont
     */
    setupModCommand() {
        if (this.#builder.name.includes('mass')) {
            this.addMassUserOption();
        } else {
            this.addTargetUserOption();
        }
        this.addReasonOption();
        return this; //allows chaining
    }


    /**
     * Retrieves the subcommand and its options from the optionbuilder
     * @returns {SlashCommandSubcommandBuilder} - the subcommandbuilder object as implemented by discord.js
     */
    getSubCmd() {
        return this.#builder;
    }


    /**
     * Makes the command temporary.
     * Will require the command caller to specify how long the command should last
     */
    makeCommandTemp() {
        if (this.#builder.name.includes('temp')) {
            this.#builder.addIntegerOption(option =>
                option.setName('duration')
                    .setDescription(`How long the command should last`)
                    .setRequired(true));
        }
        return this;
    }


    /**
     * Adds a string option which allows the moderator to tag multiple users for action
     */
    addMassUserOption() {
        this.#builder.addStringOption(option =>
            option.setName('targets')
                .setDescription(`A list of users by @mention or 18-digit IDs`)
                .setMaxLength(115)
                .setRequired(true));
                return this;
    }


    /**
     * Add a single target user option onto a builder
     * For example, a /kick command will need a user target to kick
     */
    addTargetUserOption() {
        this.#builder.addUserOption(option =>
            option.setName('target')
                .setDescription(`The @mention or 18 digit ID of a user`)
                .setRequired(true));
                return this;
    }


    /**
    * Adds an option to a command builder representing the reason a user is being removed
    */
    addReasonOption() {
        const isBanCommand = this.#builder.name.includes('ban');
        this.#builder.addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the command being used')
                .setMaxLength(512)
                .setRequired(isBanCommand));
        return this;
    }

    addRequiredTextOption() {
        this.#builder.addStringOption(option =>
            option.setName('text')
                .setDescription(`The text you want to do stuff with`)
                .setMinLength(1)
                .setMaxLength(1250)
                .setRequired(true));
        return this;
    }

    /**
     * Adds choices to the sub-command builder
     * The name and value will be the same string
     * Limitation: 25 choices
     * @param {string[]} choices - The list of choices to add
     */
    addSimpleChoices(optionName, choices) { 
        if (!Array.isArray(choices)) {
            throw new Error('Choices should be an array.');
        }
        const choicesList = choices.map(choice => ({ name: choice, value: choice }));

        this.#builder.addStringOption(option =>
            option.setName(optionName)
                .setDescription('Select an option from the list')
                .addChoices(...choicesList)
                .setRequired(true)
        );
        return this;
    }



    /**
     * Adds a choice of how many days worth of messages to purge when the command is called
     */
    addDeleteOption() {
        this.#builder.addIntegerOption(option =>
            option.setName('delete')
                .setDescription('How many days\' worth of messages to delete')
                .addChoices(
                    //0, 6, 12, 24, 72, 168 hrs in seconds
                    { name: 'Don\'t delete any', value: 0 },
                    { name: 'Last day', value: 86400 },
                    { name: 'Last 3 days', value: 259200 },
                    { name: 'Last 7 days', value: 604800 }
                )
                .setMinValue(0)
                .setMaxValue(604800));
        return this;
    }

}

module.exports = SubOptionBuilder;
