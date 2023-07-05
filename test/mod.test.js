//reusable objects
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { token } = require('../botconfig.json');
const moderation = require('../commands/moderation.js');

const mockTarget = {
    id: 'target id',
    displayAvatarURL: jest
        .fn()
        .mockReturnValue(
            'https://cdn.discordapp.com/attachments/900132649916596334/1086116570784350308/IMG_9122.jpg'
        ),
};

const mockGuild = {
    members: {
        kick: jest.fn().mockResolvedValue(), // Add the kick method mock
        cache: {
            get: jest.fn().mockReturnValue(true),
        
        },
    },
};

const mockAdmin = {
    id: '284930711566155777',
    permissions: {
        has: jest.fn().mockReturnValue(true),
    },  // An instance of Permissions with the KICK_MEMBERS flag
};

describe('/mod commands', () => {
    let client;

    beforeAll(async () => {
        client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
            ],
            user: {
                id: 'client id',
            },
        });

        const clientReady = new Promise((resolve) => {
            client.once('ready', () => {
                resolve();
            });
        });

        await client.login(token);
        await clientReady;
    });

    afterAll(async () => {
        await client.destroy();
    });

    test('Should execute /mod kick command', async () => {
        const kickMock = jest.fn().mockResolvedValue(); // Mock the kick method

        const targetUser = mockTarget;

        const interaction = {
            id: '123456789',
            guildId: '580797956983226379',
            channelId: '1048732929473384538',
            guild: mockGuild,
            member: mockAdmin,
            client: client,
            options: {
                getSubcommand: jest.fn().mockReturnValue('kick'),
                getUser: jest.fn().mockReturnValue(mockTarget),
                getString: jest.fn().mockReturnValue('Reason for kick'),
                getInteger: jest.fn().mockReturnValue(0),
            },
            reply: jest.fn(),
        };

        // Mock the kick method within the guild members cache
        mockGuild.members.kick = kickMock;

        await moderation.execute(interaction);

        // Assert that the reply function was called with the expected embed
        expect(interaction.reply).toHaveBeenCalledWith({ embeds: [expect.any(Object)] });
        expect(kickMock).toHaveBeenCalledWith(targetUser, 'Reason for kick');
    });


    test('Should execute /mod ban command', async () => {
        // Simulate the /mod ban command interaction
        // Simulate the /mod kick command interaction
        const targetUser = mockTarget;
        const interaction = {
            id: '123456789', // A unique ID for the interaction (can be any string)
            guild: mockGuild,
            guildId: '580797956983226379', // The ID of the guild where the command is executed
            channelId: '1048732929473384538', // The ID of the channel where the command is executed
            member: mockAdmin,
            client: client,
            options: {
                getSubcommand: jest.fn().mockReturnValue('ban'), // Return 'ban' as the subcommand
                getUser: jest.fn().mockReturnValue(mockTarget), // Return the target user ID
                getString: jest.fn().mockReturnValue('Reason for ban'), // Return the reason for ban
                getInteger: jest.fn().mockReturnValue(7), // Return the number of days to delete messages
            },
            reply: jest.fn(), // A mock reply function to capture the response
        };

        // Mock the member object with required properties
        const member = {
            permissions: {
                has: jest.fn().mockReturnValue(true),
            },
        };

        // Execute your /mod ban command logic
        await moderation.execute(interaction);

        // Assert that the reply function was called with the expected response
        expect(interaction.reply).toHaveBeenCalledWith('Ban command executed successfully.');
    });
});
