const { SlashCommandSubcommandBuilder } = require("discord.js");

/**
 * Use this class and its methods to add options onto a command
 */
class SubOptionBuilder {
  #builder_name
  #builder_desc
  #builder

  constructor(name, description) {
    this.#builder_name = name;
    this.#builder_desc = description;
    this.#builder = new SlashCommandSubcommandBuilder()
      .setName(name)
      .setDescription(description)
   //addTargetUserOption(); //all commands
    //addReasonOption();
  }


  getBuiltCmd(){
    return this.#builder;
  }


  /**
   * Makes the command temporary.
   * Will require the command caller to specify how long the command should last
   * @param {SlashCommandSubcommandBuilder} builder - a subcommand builder object to add the temporary property to
   */
  makeCommandTemp() {
    if (this.#builder.name.includes('temp')) {
      this.#builder.addIntegerOption(option =>
        option.setName('duration')
          .setDescription('How long the punishment should last')
          .setRequired(true));
    }
  }


  /**
   * Add a single target user option onto a builder
   * For example, a /kick command will need a user target to kick
   * @param {SlashCommandBuilder, SlashSubCommandBuilder} builder - builder object to add a target property to
   */
  addTargetUserOption() {
    this.#builder.addUserOption(option =>
      option.setName('target')
        .setDescription(`Mention or ID of user to ${this.#builder_name}`)
        .setRequired(true));
  }


  /**
 * Adds a  option to a command builder representing the reason a user is being removed
 * @param {SlashCommandBuilder, SlashCommandSubcommandBuilder} builder - builder object to add the reason property to
 */
  addReasonOption() {
    let is_required = false;
    if (this.#builder.name.includes('ban')) { //ban commands should always have a reason (why? they have permanent effects)
      is_required = true;
    }
    this.#builder.addStringOption(option =>
      option.setName('reason')
        .setDescription('The behaviour the user is being punished for')
        .setMaxLength(512)
        .setRequired(is_required));
  }


  /**
   * Adds a choice of how many days worth of messages to purge when the command is called
   * @param {SlashCommandBuilder, SlashCommandSubcommandBuilder} builder 
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
  }
  // additional methods can be defined here
}

module.exports = SubOptionBuilder;
