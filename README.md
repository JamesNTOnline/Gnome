
HOW TO READ AND USE COMMAND FILES:
- Each command file contains a set of commands which fall into a category
- the command group name is at the top level and becomes uncallable
- the subcommands are blocks of code which allocate the names, descriptions, and options for the actual callable commands
- in discord you see: /mod kick, /mod ban, /mod masskick, etc
- /mod *CANNOT* be called by itself, as a consequence of being subcommanded; without subcommands it may have its own behaviour
- for safety, subcommands with options that require some target should always be required (true)

- at the end of the file is the exported interaction resolver function. here, behaviour *must* be specified for each subcommand 
  retrieve the name and input of the interaction using interaction.options methods and go from there

*WARNING: each top level command, though invisible and unusable by the user, must have a name and description.*
This is required by the command builder's toJSON() function, it will throw an error if either one is missing


COMMAND STRUCTURE NOTES:
=============================
An app can have <=25 subcommand groups on a top-level command
An app can have <=25 subcommands within a subcommand group
Commands can have <=25 options
Options can have <=25 choices


// https://discordjs.guide/popular-topics/embeds.html#embed-preview
// https://www.codegrepper.com/tpc/avatar+command+discord.js
// see: https://discordjs.guide/slash-commands/advanced-creation.html#option-types for the allowed input types
*/

Subcommand must not be above Command Group
Command Group cannot be nested within Command Group
Command > Command Group > Subcommand

command
|
|___subcommand
|
|___subcommand

OR

command
   |
   |___subcommand group
   |        |
   |        |__subcommand (choices)
   |
   |__subcommand group
            |
            |__subcommand (options + choices)
            |
            |__subcommand (options)

A REAL EXAMPLE

command: /mod
|
|___sub: kick -> (Options: target, reason)
|
|___sub: ban -> (Options: target, reason[Required], delete-history)




