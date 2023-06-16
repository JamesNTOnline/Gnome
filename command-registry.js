
//commands.json holds data regarding each command
const commandsData = JSON.parse(fs.readFileSync('commands.json'));

/**
 * Get the description of a command.
 * @param {String} command - The name of the command
 * @returns {String} - The description of what the command does
 */
function getDescription(command) {
  const topLevelCommand = commandsData.find(cmd => cmd.name === command);
  if (topLevelCommand) {
    return topLevelCommand.description;
  }

  // If the command is not found at the top level, search in subcommands
  for (const cmd of commandsData) {
    // Find the subcommand within each top level command
    const subcommand = cmd.subcommands.find(subcmd => subcmd.name === command);
    if (subcommand) {
      return subcommand.description;
    }
  }

  // Command not found
  return "Command not found.";
}

module.exports = { commandsData, getDescription };
