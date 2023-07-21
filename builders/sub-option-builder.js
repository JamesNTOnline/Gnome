const { SlashCommandSubcommandBuilder } = require("discord.js");
const commandRegistry = require('../command-registry.js');

/**
 * I have a different idea for how to handle this. More of a long-term/if the project gets larger goal
 * I want to make the api function calls dynamic and simply store every each command and its options as json
 * This would make setting up a subcommand object as simple as adding it to the json file, but means rewriting some of the existing code
 * tl;dr: @todo change how command setup works
 */

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
                    .setDescription(`How long the ${this.builder.name} should last`)
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
                .setDescription(`Users to ${this.#builder.name }, by @mention or 18-digit ID`)
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
                .setDescription(`Mention or ID of user to ${this.#builder.name }`)
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
                .setDescription('The behavior the user is being punished for')
                .setMaxLength(512)
                .setRequired(isBanCommand));
        return this;
    }
/*     addReasonOption() {
        let required = false; //refactor this
        if (this.#builder.name.includes('ban')) { //ban commands should always have a reason (why? they have permanent effects)
            required = true;
        }
        this.#builder.addStringOption(option =>
            option.setName('reason')
                .setDescription('The behaviour the user is being punished for')
                .setMaxLength(512)
                .setRequired(required));
    } */


    /**
     * Adds a choice of how many days worth of messages to purge when the command is called
     */
    addDeleteOption() {
        this.#builder.addIntegerOption(option =>
            option.setName('delete')
                .setDescription('Number of days worth of messages to purge')
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
