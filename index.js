const fs = require('fs'); 
const path = require('path'); 
const { Client, Events, Collection, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron'); //task automation module
const { token } = require('./botconfig.json'); //keep token safe & private


/**
 * Applies a handling function to each file in a provided folder
 * @param {object} client - The Discord client object
 * @param {string} folder - The name of the folder containing the files
 * @param {function} fileHandler - A processing function to apply to each file.
 */
function processFiles(client, folder, fileHandler) {
    try {
        const folderPath = path.join(__dirname, folder);
        const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const fileContent = require(filePath); //require works conditionally with .js files
            fileHandler(client, fileContent, filePath); 
        }
    } catch (error) {
        console.error(`Error processing files in '${folder}':`, error);
    }
}


/**
 * Schedules a subcommand to run at a specific time
 * @param {string} subcommandName - The name of the subcommand to schedule
 * @param {string} channelID - The ID of the Discord channel where the subcommand should be executed
 * @param {string} cronExpression - The cron expression specifying when to execute the subcommand.
 * @param {Array} args - Subcommand-specific arguments to be passed in
 */
function scheduleSubcommand(subcommandName, channelID, cronExpression, args) {
    cron.schedule(cronExpression, () => {
        executeSubcommand(subcommandName, channelID, args);
    });
}


/**
 * Executes a subcommand on a specific Discord channel
 * @param {string} subcommandName - The name of the subcommand to execute
 * @param {string} channelID - The ID of the Discord channel where the subcommand should be executed.
 * @param {Array} args - The arguments to pass to the subcommand when executed.
 */
function executeSubcommand(subcommandName, channelID, args) {
    const channel = client.channels.cache.get(channelID);
    if (!channel) return console.error(`Channel with ID ${channelID} not found.`);
    const command = client.commands.get('clear');
    if (!command || !command.subcommands.has(subcommandName)) {
        return console.error(`Subcommand "${subcommandName}" not found.`);
    }
    try {
        command.subcommands.get(subcommandName).execute(client, channel, args);
    } catch (error) {
        console.error(`Error executing "${subcommandName}":`, error);
    }
}


//create a new client instance
const client = new Client({
    intents: [ //intents are what the bot is able to interact with
        GatewayIntentBits.Guilds, //baseline to work
        GatewayIntentBits.GuildMessages, //required to receive messages
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, //to receive member information (e.g. for greetings)
    ],
});

//run through the commands folder and add each command file's command to the client collection
client.commands = new Collection(); //discord.js extension of Map
processFiles(client, 'commands', (client, command, filePath) => {
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`WARNING: Command at ${filePath} is missing data or execute properties`);
    }
});
//as above, but with the events folder
processFiles(client, 'events', (client, event) => {
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
});
client.login(token); //finally, log in with the bot token
console.log(client.commands);


/**
 * @todo: I want to create some timed automatic commands,
 * however, discord.js' slash command system is based around "interactions" which are a special type of message with their own methods
 * options: 
 * - make all of my commands work without the interaction (essentially ignore it - tedious)
 * - mock an interaction... after exploring and trying different things this doesn't work properly as discord.js relies on responding to and retrieving information from, a real interaction
 * - create a second version of certain commands which don't use interactions at all and can be fired independently & automatically
 */

