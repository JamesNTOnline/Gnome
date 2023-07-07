//reusable objects
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { token } = require('../botconfig.json');
const moderation = require('../commands/moderation.js');

const mockTarget = {
    id: 'target id',
    displayAvatarURL: jest.fn().mockReturnValue('https://cdn.discordapp.com/attachments/900132649916596334/1086116570784350308/IMG_9122.jpg'),
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


function mockInteraction(options) {
    return {
        id: '123456789',
        guildId: '580797956983226379',
        channelId: '1048732929473384538',
        guild: mockGuild,
        member: mockAdmin,
        client: options.client,
        options: {
            getSubcommand: jest.fn().mockReturnValue(options.subcommand),
            getUser: jest.fn().mockReturnValue(options.targetMock),
            getString: jest.fn().mockReturnValue(options.reason),
            getInteger: jest.fn().mockReturnValue(options.delete),
        },
        reply: jest.fn(),
    };
}

describe('/mod commands', () => {
    let client;
    let targetMock;
    beforeAll(async () => { //sets up once before all tests
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
        targetMock = {
            id: 'target id',
            displayAvatarURL: jest.fn().mockReturnValue('https://cdn.discordapp.com/attachments/900132649916596334/1086116570784350308/IMG_9122.jpg'),
        };

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


    test('testing a successful /mod kick command', async () => {
        const kickMock = jest.fn().mockResolvedValue(); // Mock the kick method
        const interaction = mockInteraction({
            targetMock: targetMock,
            client: client,
            subcommand: 'kick',
            reason: 'Reason for kick',
            delete: 0,
        });
        // Mock the kick method within the guild members cache
        mockGuild.members.kick = kickMock;
        await moderation.execute(interaction);
        // Assert that the reply function was called with the expected embed - in this case i simply expect an embed, 
        // but could specify which fields are included.
        expect(interaction.reply).toHaveBeenCalledWith({ embeds: [expect.any(Object)] });
        expect(kickMock).toHaveBeenCalledWith(targetUser, 'Reason for kick'); //check that the user was kicked with the reason specified earlier
    });


    test('testing a successful /mod ban command', async () => {
        const banMock = jest.fn().mockResolvedValue(); // Mock the kick method
        const interaction = mockInteraction({
            targetMock, targetMock,
            client: client,
            subcommand: 'ban',
            reason: 'Reason for ban',
            delete: 86400,
        });

        // Mock the kick method within the guild members cache
        mockGuild.members.ban = banMock;
        await moderation.execute(interaction);
        // Assert that the reply function was called with the expected embed - in this case i simply expect an embed, 
        // but could specify which fields are included.
        expect(interaction.reply).toHaveBeenCalledWith({ embeds: [expect.any(Object)] });
        expect(banMock).toHaveBeenCalledWith(targetUser, {deleteMessageSeconds: 86400, reason: "Reason for ban"}); //check that the user was kicked with the reason specified earlier
    });
});
