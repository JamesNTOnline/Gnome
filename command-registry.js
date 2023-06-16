

// Load the commands data into a variable
const commandsData = JSON.parse(fs.readFileSync('commands.json'));

function getDescription(command) {
  const topLevelCommand = commandsData.find(cmd => cmd.name === command);
  if (topLevelCommand) {
    return topLevelCommand.description;
  }

  // If the command is not found at the top level, search in subcommands
  for (const cmd of commandsData) {
    const subcommand = cmd.subcommands.find(subcmd => subcmd.name === command);
    if (subcommand) {
      return subcommand.description;
    }
  }

  return "Command not found.";
}

module.exports = {commandsData, getDescription};