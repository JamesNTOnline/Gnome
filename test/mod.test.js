const { Client, GatewayIntentBits } = require('discord.js');
const { token } = require('../botconfig.json');
const moderation = require('../commands/moderation.js');

describe('/mod kick Command', () => {
    let client;

    beforeAll(async () => {
        // Create a new Discord client instance
        client = new Client({
            intents: [
                GatewayIntentBits.Guilds, //baseline
                GatewayIntentBits.GuildMessages, //required to receive messages
                GatewayIntentBits.MessageContent, //to receive content of messages
                GatewayIntentBits.GuildMembers, //to receive member information (e.g. for greetings)
            ]
        });

        // Create a promise that resolves when the client is ready
        const clientReady = new Promise((resolve) => {
            client.once("ready", () => {
                resolve();
            });
        });
        // Wait for the client to be ready
        await client.login(token);
        // Wait for the client to be ready
        await clientReady;

        afterAll(async () => {
            // Destroy the client connection
            await client.destroy();
        });

        test('Should execute /mod kick command', async () => {
            // Simulate the /mod kick command interaction
            const interaction = {
                id: '123456789', // A unique ID for the interaction (can be any string)
                guildId: '580797956983226379', // The ID of the guild where the command is executed
                channelId: '1048732929473384538', // The ID of the channel where the command is executed
                member: {
                    id: '284930711566155777', // The ID of the member executing the command
                    permissions: ['KICK_MEMBERS'], // An array of permission flags for the member
                },
                options: {
                    getSubcommand: jest.fn().mockReturnValue('kick'), // Return 'kick' as the subcommand
                    getUser: jest.fn().mockReturnValue({ id: '716390085896962058' }), // Return the target user ID
                    getString: jest.fn().mockReturnValue('Reason for kick'), // Return the reason for kick
                    getInteger: jest.fn().mockReturnValue(0), // Return the number of days to delete messages
                },
                reply: jest.fn(), // A mock reply function to capture the response
            };

            // Execute your /mod kick command logic
            await moderation.execute(interaction);

            // Assert that the reply function was called with the expected response
            expect(interaction.reply).toHaveBeenCalledWith('Kick command executed successfully.');
        });


        test('Should execute /mod ban command', async () => {
            // Simulate the /mod ban command interaction

            const interaction = {
                id: '123456789', // A unique ID for the interaction (can be any string)
                guildId: '580797956983226379', // The ID of the guild where the command is executed
                channelId: '1048732929473384538', // The ID of the channel where the command is executed
                member: {
                    id: '284930711566155777', // The ID of the member executing the command
                    permissions: ['BAN_MEMBERS'], // An array of permission flags for the member
                },
                options: {
                    getSubcommand: jest.fn().mockReturnValue('ban'), // Return 'ban' as the subcommand
                    getUser: jest.fn().mockReturnValue({ id: '716390085896962058' }), // Return the target user ID
                    getString: jest.fn().mockReturnValue('Reason for ban'), // Return the reason for ban
                    getInteger: jest.fn().mockReturnValue(7), // Return the number of days to delete messages
                },
                reply: jest.fn(), // A mock reply function to capture the response
            };

            // Execute your /mod ban command logic
            await moderation.execute(interaction);

            // Assert that the reply function was called with the expected response
            expect(interaction.reply).toHaveBeenCalledWith('Ban command executed successfully.');
        });


    });
});
