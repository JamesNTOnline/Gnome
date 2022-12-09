
//best practice? use const. change to let or var if needed
const fs =  require('node:fs'); //filesystem module
const path = require('node:path'); //path module
const {Client, Events, Collection, GatewayIntentBits} = require('discord.js');
const {token} = require('./botconfig.json');

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
const commandFiles = fs.readdirSync(commandsPath).filter(file=>file.endsWith('.js'));
//const commandFiles = getFileList(commandsPath).filter(file=>file.endsWith('.js')); alternative way, see below
client.commands = new Collection(); //extends Map - O(1) TC
//loop over the file array and get the path to the commands
for (const file of commandFiles){
    const fp = path.join(commandsPath, file);
    const command = require(fp);
//K:V pair name:exported module
if('data' in command && 'execute' in command){ //checking the command does something
    client.commands.set(command.data.name, command); //add to the array
} else {
    console.log(`WARNING: Command at ${filePath} is missing data or execute properties`);
    }
}


/*
get the path to the event handler folder (events) and get the array of js files
handle each type of event (for now, there are .once and regular interactions)
*/
const eventsPath = path.join(__dirname, 'events');
const eventsFiles = fs.readdirSync(eventsPath).filter(file=>file.endsWith('.js'));
for (const file of eventsFiles){
    const fp = path.join(eventsPath, file);
    const event = require(fp);
    /*(...args) - variable # of arguments. with slash commands arguments may have
    different options, or none. collects args into an array
    the iterable is given to the function and expanded depending on expected arguments
    */
    if(event.once){
        client.once(event.name, (...args)=>event.execute(...args));
    } else {
        client.on(event.name, (...args)=> event.execute(...args));
    }
}

//TODO:
// Have avatar automatically update its avatar for time of year

// log into discord with client token
client.login(token);


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
