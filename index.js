// Require the necessary discord.js classes
const {Client, GatewayIntentBits} = require('discord.js');
const { token } = require('./botconfig.json');

// Create a new client instance
const client = new Client({
    intents: [
		GatewayIntentBits.Guilds, //baseline
		GatewayIntentBits.GuildMessages, //required to receive messages
		GatewayIntentBits.MessageContent, //to receive content of messages
		GatewayIntentBits.GuildMembers, //to receive member information (e.g. for greetings)
	],
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});

// Login to Discord with your client's token
client.login(token);



// const botconfig = require("./botconfig.json");
// const Discord = require("discord.js");
// const bot = new Discord.Client({ disableEveryone: false });
// const fs = require("fs");
// bot.commands = new Discord.Collection();
//
// fs.readdir("./commands/", (err, files) => {
//   if (err) console.log(err);
//   let jsfile = files.filter(f => f.split(".").pop() === "js")
//   if (jsfile.length <= 0) {
//     console.log("can't find commands");
//     return;
//   }
//   jsfile.forEach((f, i) => {
//     let props = require(`./commands/${f}`);
//     console.log(`${f} loaded`);
//     bot.commands.set(props.help.name, props);
//   });
//
// });
//
// bot.on("ready", async () => {
//   console.log(`${bot.user.username} is online!`);
//   bot.user.setActivity("Editing Wikipedia")
// });
//
//
// bot.on("message", async message => {
//   if (message.author.bot) return;
//   if (message.channel.type === "dm") return;
//   let prefix = "+";
//   let messageArray = message.content.split(" ");
//   let command = messageArray[0];
//   let args = messageArray.slice(1);
//   let commandFile = bot.commands.get(command.slice(prefix.length));
//   if (commandFile) commandFile.run(bot, message, args);
// });
//
// //bot.login(process.env.BOT_TOKEN)
// bot.login(botconfig.token);
