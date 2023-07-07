//reusable objects
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { token } = require('../botconfig.json');
const moderation = require('../commands/moderation.js');

const targetMock = {
    id: 'target id',
    displayAvatarURL: jest.fn().mockReturnValue('https://cdn.discordapp.com/attachments/900132649916596334/1086116570784350308/IMG_9122.jpg'),
};

const mockGuild = {
    members: {
        kick: jest.fn().mockResolvedValue(), // Add the kick method mock
        cache: {
            get: jest.fn().mockReturnValue(true),
        }
    }
};

const mockAdmin = {
    id: '284930711566155777',
    permissions: {
        has: jest.fn().mockReturnValue(true),
    }
};


describe('/mod commands', () => {
    let client;
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
        const kickMock = jest.fn().mockResolvedValue();
        mockGuild.members.kick = kickMock;

        const interaction = setupInteraction(client, 'kick', 'Reason for kick', 0);
        await moderation.execute(interaction);

        assertSuccessfulCommandExecution(interaction, kickMock, [targetMock, 'Reason for kick']);
    });

    test('testing a failed /mod kick command due to insufficient permissions', async () => {
        const kickMock = jest.fn().mockResolvedValue();
        mockAdmin.permissions.has.mockImplementation((flag) => {
            return flag === PermissionsBitField.Flags.KickMembers ? false : true;
        });
        mockGuild.members.kick = kickMock;

        const interaction = setupInteraction(client, 'kick', 'Reason for kick', 0);
        await moderation.execute(interaction);

        assertInsufficientPermissions(interaction, kickMock);
    });

    test('testing a successful /mod ban command', async () => {
        const banMock = jest.fn().mockResolvedValue();
        mockGuild.members.ban = banMock;

        const interaction = setupInteraction(client, 'ban', 'Reason for ban', 86400);
        await moderation.execute(interaction);

        assertSuccessfulCommandExecution(interaction, banMock, [targetMock, { deleteMessageSeconds: 86400, reason: 'Reason for ban' }]);
    });

    test('testing a failed /mod ban command due to insufficient permissions', async () => {
        const banMock = jest.fn().mockResolvedValue();
        mockAdmin.permissions.has.mockImplementation((flag) => {
            return flag === PermissionsBitField.Flags.BanMembers ? false : true;
        });
        mockGuild.members.ban = banMock;

        const interaction = setupInteraction(client, 'ban', 'Reason for ban', 0);
        await moderation.execute(interaction);

        assertInsufficientPermissions(interaction, banMock);
    });
});



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
            getUser: jest.fn().mockReturnValue(targetMock),
            getString: jest.fn().mockReturnValue(options.reason),
            getInteger: jest.fn().mockReturnValue(options.delete),
        },
        reply: jest.fn(),
    };
}

// Helper function to setup the interaction object
function setupInteraction(client, subcommand, reason, deleteValue) {
    const interaction = mockInteraction({
        client: client,
        subcommand: subcommand,
        reason: reason,
        delete: deleteValue,
    });
    return interaction;
}

// Helper function to assert the successful execution of a command
function assertSuccessfulCommandExecution(interaction, mockMethod, expectedOptions) {
    expect(interaction.reply).toHaveBeenCalledWith({ embeds: [expect.any(Object)] });
    expect(mockMethod).toHaveBeenCalledWith(...expectedOptions);
}

// Helper function to assert the failure of a command due to insufficient permissions
function assertInsufficientPermissions(interaction, mockMethod) {
    expect(interaction.reply).toHaveBeenCalledWith('You don\'t have permission for that!');
    expect(mockMethod).not.toHaveBeenCalled();
}