const botconfig = require("./botconfig.json");
const Discord = require("discord.js");
const bot = new Discord.Client({ disableEveryone: true });
const fs = require("fs");
bot.commands = new Discord.Collection();

fs.readdir("./commands/", (err, files) => {
  if (err) console.log(err);
  let jsfile = files.filter(f => f.split(".").pop() === "js")
  if (jsfile.length <= 0) {
    console.log("can't find commands");
    return;
  }
  jsfile.forEach((f, i) => {
    let props = require(`./commands/${f}`);
    console.log(`${f} loaded`);
    bot.commands.set(props.help.name, props);
  });

});

bot.on("ready", async () => {
  console.log(`${bot.user.username} is online!`);
  bot.user.setActivity("with yer maw")
});

bot.on("message", async message => {
  if (message.author.bot) return;
  if (message.channel.type === "dm") return;
  let prefix = botconfig.prefix;
  let messageArray = message.content.split(" ");
  let command = messageArray[0];
  let args = messageArray.slice(1);
  /*This is the command handler. It attempts to retrieve a named file from the
    commands folder, then if it exists, calls the function to run that command*/
  let commandFile = bot.commands.get(command.slice(prefix.length));
  if (commandFile) commandFile.run(bot, message, args);
});

bot.login(process.env.BOT_TOKEN)
