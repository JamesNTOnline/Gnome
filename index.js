/**
destructuring a const called Client from the object returned
by the require() statement.

In other words: require returns something from the discord.js module
The token const is then destructured:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment

const{a, b} = obj is equivalent to const a = obj.a, const b = obj.b
require() allows access to files, packages, etc.
and should be done a the top of the file.
*/
const fs =  require('node:fs'); //locading command files
const path = require('node:path');
const {Client, Events, GatewayIntentBits} = require('discord.js');
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

client.commands = new Collection(); //extends Map - O(1) runtime
const commandsPath = path.join(__dirname, 'commands');
//returns array of filenames, filter() removes any non .js files
const commandFiles = fs.readdirSync(commandsPath).filter(file=>file.endsWith('.js'));
//loop over the file array and get the path to the commands
for (const file of commandFiles){
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
//new item K:V pair name:exported module
if('data' in command && 'execute' in command){ //checking the command does something
    client.commands.set(command.data.name, command); //add to the array
} else {
    console.log('WARNING: Command at ${filePath} is missing data or execute properties');
    }
}

//handles execution of commands using the execute() function in a command file
client.on(Events.InteractionCreate, interaction =>{
    if(!interaction.isChatInputCommand()) return;
    //match the command to the client's list of commands stored above
    const command = interaction.client.commands.get(interaction.commandName);
    if(!command){ //no match, error
        console.error('No command matching ${interaction.commandName} found!');
    }
    try { //try to execute the command using execute method
        await command.execute(interaction);
    } catch (error){ //catch any errors caused during runtime and report
        console.error(error);
        await interaction.reply({content: 'Error while executing command', ephemeral: true});
    }    
});

// when client ready, run this once
// 'c' s event parameter to keep it separate from the 'client'
client.once(Events.ClientReady, c =>{
    console.log('Ready! Logged in as ${c.user.tag}');
    c.user.setPresence({ activities: [{ name: 'Copying articles from Wikipedia' }],
    status: 'idle' });
});

//TODO:
// Have avatar automatically update its avatar for time of year

// log into discord with  client token
client.login(token);
