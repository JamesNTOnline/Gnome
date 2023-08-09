

const { SlashCommandBuilder, SlashCommandSubcommandBuilder, PermissionsBitField } = require('discord.js');
const SubOptionBuilder = require('../utilities/sub-option-builder');
// Import the JSON data from data.json
const styles = require('../utilities/text-styles.json'); //discord doesn't allow "true" fonts, but you can add the character mappings in this file

//server tidy-up commands
let emojify = new SubOptionBuilder('emojify').getSubCmd();
let cuteify = new SubOptionBuilder('cuteify').getSubCmd();
let jarjar = new SubOptionBuilder('jarjar').getSubCmd();
let zoomify = new SubOptionBuilder('zoomify').getSubCmd();
let random = new SubOptionBuilder('random').getSubCmd();
let clap = new SubOptionBuilder('clap').getSubCmd();
let style = new SubOptionBuilder('style')
    .addRequiredTextOption()
    .addSimpleChoices('style', Object.keys(styles))
    .getSubCmd(); //add choices
let translate = new SubOptionBuilder('translate').getSubCmd();


//https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses

module.exports = { //exports data in Node.js so it can be require()d in other files
    data: new SlashCommandBuilder()
        .setName('text')
        .setDescription('Transforms some provided text')
        .addSubcommand(style),

    async execute(interaction) {
        const cmd_name = interaction.options.getSubcommand();
        const text = interaction.options.getString('text');
        let editedText = "";
        switch (cmd_name) { // processing the options
            case "emojify":
                await interaction.reply('ph');
                break;
            case "cuteify":
                await interaction.reply('ph');
                break;
            case "jarjar":
                await interaction.reply('ph');
                break;
            case "zoomify":
                await interaction.reply('ph');
                break;
            case "random":
                await interaction.reply('ph');
                break;
            case "clap":
                await interaction.reply('ph');
                break;
            case "style":
                try {
                    await interaction.reply('Beautifying text...')
                    const style = interaction.options.getString('style');
                    editedText = applyStyleToText(text, style);
                    await interaction.editReply(editedText);
                } catch (error) {
                    console.error('Error occurred during style command:', error.message);
                    await interaction.editReply('An error occurred while processing the style command.');
                }
                break;
            case "translate":
                await interaction.reply('ph');
                break;
        }
    },


};

function replaceWordsInText(text){
    
}


function applyStyleToText(text, styleName) {
    if (!styles[styleName]) {
        throw new Error('Style does not exist, see text-styles.json');
    }
    const styleMap = styles[styleName];
    const stylizedText = text.replace(/./g, (char) => styleMap[char] || char);
    return stylizedText;
}

