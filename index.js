
//best practice? use const. change to let or var if needed
const fs = require('fs'); //filesystem module
const path = require('path'); //path module
const { Client, Events, Collection, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const { token } = require('./botconfig.json');

// create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, //baseline
        GatewayIntentBits.GuildMessages, //required to receive messages
        GatewayIntentBits.MessageContent, //to receive content of messages
        GatewayIntentBits.GuildMembers, //to receive member information (e.g. for greetings)
    ],
});


/*
get the path to the commands folder
read the path and return the .js files as an array ['ban.js', 'echo.js'...]
can then build the client's command list which can be used by other files
*/
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
//const commandFiles = getFileList(commandsPath).filter(file=>file.endsWith('.js')); alternative way, see below
client.commands = new Collection(); //extends Map - O(1) TC
//loop over the file array and get the path to the commands
for (const file of commandFiles) {
    const fp = path.join(commandsPath, file);
    const command = require(fp);
    //K:V pair name:exported module
    if ('data' in command && 'execute' in command) { //checking the command does something
        client.commands.set(command.data.name, command); //add to the array
    } else {
        console.log(`WARNING: Command at ${fp} is missing data or execute properties`);
    }
}


/*
get the path to the event handler folder (events) and get the array of js files
handle each type of event (for now, there are .once and regular interactions)
*/
const eventsPath = path.join(__dirname, 'events');
const eventsFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventsFiles) {
    const fp = path.join(eventsPath, file);
    const event = require(fp);
    /*
    (...args) - variable # of arguments. with slash commands arguments may have
    different options, or none. collects args into an array
    the iterable is given to the function and expanded depending on expected arguments
    */
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

//TODO:
// Have avatar automatically update its avatar for time of year
// Schedule the subcommand "/clear nicknames" at 12:00 PM (noon) every day
//scheduleSubcommand('nicknames', '439519603459227661', '29 17 * * *', []);

// log into discord with client token
client.login(token);


/**
 * @todo: I want to create some timed automatic commands,
 * however, discord.js' slash command system is based around "interactions" which are a special type of message with their own methods
 * options: 
 * - make all of my commands work without the interaction (essentially ignore it - tedious)
 * - mock an interaction... after exploring and trying different things this doesn't work properly as discord.js relies on responding to and retrieving information from, a real interaction
 * - create a second version of certain commands which don't use interactions at all and can be fired independently & automatically
 */


// Function to schedule a subcommand at a specific time
function scheduleSubcommand(subcommandName, channelID, cronExpression, args) {
    cron.schedule(cronExpression, () => {
        executeSubcommand(subcommandName, channelID, args);
    });
}

// Function to execute a subcommand
function executeSubcommand(subcommandName, channelID, args) {
    const channel = client.channels.cache.get(channelID);
    if (!channel) return console.error(`Channel with ID ${channelID} not found.`);

    // Check if the subcommand exists in client.commands
    const command = client.commands.get('clear');
    if (!command || !command.subcommands.has(subcommandName)) {
        return console.error(`Subcommand "${subcommandName}" not found.`);
    }

    // Execute the subcommand using the command module export
    try {
        command.subcommands.get(subcommandName).execute(client, channel, args);
    } catch (error) {
        console.error(`Error executing "${subcommandName}":`, error);
    }
}

//alternative way to organise files - loops through subfolders and adds the file names to a returned array
/* const getFileList = (dirName) => {
    let files = [];
    const items = fs.readdirSync(dirName, { withFileTypes: true });

    for (const item of items) {
        if (item.isDirectory()) {
            files = [...files, ...getFileList(`${dirName}/${item.name}`)];
        } else {
            files.push(`${item.name}`);
        }
    }

    return files;
}; */
