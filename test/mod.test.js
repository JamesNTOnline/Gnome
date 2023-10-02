//reusable objects
const { Client, GatewayIntentBits, PermissionsBitField, Collection } = require('discord.js');
const { token } = require('../botconfig.json');
const moderation = require('../commands/moderation.js');

const targetMock = {
    id: 'target id',
    displayAvatarURL: jest.fn().mockReturnValue('https://cdn.discordapp.com/tar_avatar.jpg'),
};

const guildMock = {
    members: {
        kick: jest.fn().mockResolvedValue(), // Add the kick method mock
        ban: jest.fn().mockResolvedValue(),
        cache: {
            get: jest.fn().mockReturnValue(true),
            has: jest.fn().mockReturnValue(true),
        }
    },
    bans: {
        fetch: jest.fn().mockResolvedValue(new Collection())
    }
};

const adminMock = {
    id: 'admin id',
    displayAvatarURL: jest.fn().mockReturnValue('https://cdn.discordapp.com/admin_avatar.jpg'),
    permissions: {
        has: jest.fn().mockReturnValue(true),
    }
};


describe('/mod commands', () => {
    let clientMock;
    beforeAll(async () => { //sets up once before all tests
        clientMock = new Client({
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
            clientMock.once('ready', () => {
                resolve();
            });
        });

        await clientMock.login(token);
        await clientReady;
    });

    afterAll(async () => {
        await clientMock.destroy();
    });


    test('testing: a successful /mod kick command', async () => {
        //const kickMock = jest.fn().mockResolvedValue();
        //guildMock.members.kick = kickMock;
        const interactionMock = setupMockInteraction(clientMock, 'kick', 'Reason for kick', 0);

        await moderation.execute(interactionMock);

        assertSuccessfulCommandExecution(
            interactionMock,
            guildMock.members.kick,
            [targetMock, 'Reason for kick' ],
            '**Kicked** target id: Reason for ban'
        );
    });

    test('testing: a successful /mod ban command', async () => {
        //const banMock = jest.fn().mockResolvedValue();
        //guildMock.members.ban = banMock;
        const interactionMock = setupMockInteraction(clientMock, 'ban', 'Reason for ban', 86400);
   
        // Assert that the fetch method of guildMock.bans is called
        await moderation.execute(interactionMock);
        assertSuccessfulCommandExecution(
            interactionMock,
            guildMock.members.ban,
            [targetMock, { deleteMessageSeconds: 86400, reason: 'Reason for ban' }],
            '**Banned** target id: Reason for ban'
        );
    });

    test('testing: sending a PM to a user', async () => {}); //to do

    test('testing: unbanning a banned user', async () => {}); 

    test('testing: banning a banned user', async () => {
        // mock object for the banned member
        // const bannedMember = { id: '123456789', user: { username: 'BannedUser' } };
        // return a mock collection containing the banned member
        // interactionMock.guild.bans.fetch = jest.fn().mockResolvedValue(new Collection([[bannedMember.id, bannedMember]]));
        // expect(interactionMock.guild.bans.fetch().get(bannedMember.id)).toEqual(bannedMember);
    });


    test('testing: unbanning a not-banned user', async () => {}); //

    test('testing: sending a PM to a user', async () => {}); //

    test('testing: failed /mod ban due to client targetting itself', async () => {
        //const banMock = jest.fn().mockResolvedValue();
        //guildMock.members.ban = banMock;
        const interactionMock = setupMockInteraction(clientMock, 'ban', 'Reason for ban', 0);
        // Set the target ID to be the same as the client's user ID
        interactionMock.options.getUser.mockReturnValue({
            id: clientMock.user.id,
            displayAvatarURL: jest.fn().mockReturnValue(clientMock.user.defaultAvatarURL),
        });
        await moderation.execute(interactionMock);

        expect(interactionMock.reply).toHaveBeenCalledWith({content: 'I can\'t Gnome myself!', ephemeral: true});
        expect(guildMock.members.ban).not.toHaveBeenCalled();
    });

    test('testing: failed /mod ban when user targets themselves', async () => {
        //const banMock = jest.fn().mockResolvedValue();
        //guildMock.members.ban = banMock;
        const interactionMock = setupMockInteraction(clientMock, 'ban', 'Reason for ban', 0);
        // Set the target ID to be the same as the command caller's ID
        interactionMock.options.getUser.mockReturnValue(adminMock);
        await moderation.execute(interactionMock);

        expect(interactionMock.reply).toHaveBeenCalledWith({content: 'I can\'t help you Gnome yourself!', ephemeral: true});
        expect(guildMock.members.ban).not.toHaveBeenCalled();
    });

    test('testing: failed /mod kick due to insufficient permissions', async () => {
        //const kickMock = jest.fn().mockResolvedValue();
        //guildMock.members.kick = kickMock;
        adminMock.permissions.has.mockImplementation((flag) => {
            return flag === PermissionsBitField.Flags.KickMembers ? false : true;
        });
        const interactionMock = setupMockInteraction(clientMock, 'kick', 'Reason for kick', 0);
        await moderation.execute(interactionMock);
        assertInsufficientPermissions(interactionMock, guildMock.members.kick);
    });

    test('testing: failed /mod ban due to insufficient permissions', async () => {
        //const banMock = jest.fn().mockResolvedValue();
        //guildMock.members.ban = banMock;
        adminMock.permissions.has.mockImplementation((flag) => {
            return flag === PermissionsBitField.Flags.BanMembers ? false : true;
        });
        const interactionMock = setupMockInteraction(clientMock, 'ban', 'Reason for ban', 0);
        await moderation.execute(interactionMock);
        assertInsufficientPermissions(interactionMock, guildMock.members.ban);
    });


});


/**
 * Sets up an interaction object for testing purposes.
 * @param {Client} client - The Discord.js client instance.
 * @param {string} subcommand - The subcommand for the interaction.
 * @param {string} reason - The reason value for the interaction.
 * @param {number} deleteValue - The delete value for the interaction.
 * @returns {Object} The configured interaction object.
 */
function setupMockInteraction(client, subcommand, reason, deleteValue) {
    // Create and configure the interaction object
    const interaction = {
        id: '123456789',
        guildId: '580797956983226379',
        channelId: '1048732929473384538',
        guild: guildMock,
        member: adminMock,
        client: client,
        options: {
            getSubcommand: jest.fn().mockReturnValue(subcommand),
            getUser: jest.fn().mockReturnValue(targetMock),
            getString: jest.fn().mockReturnValue(reason),
            getInteger: jest.fn().mockReturnValue(deleteValue),
        },
        reply: jest.fn(),
        deleteReply: jest.fn(),
        followUp: jest.fn(),
    };
    return interaction;
}


// Helper function to assert the successful execution of a command
function assertSuccessfulCommandExecution(interaction, methodToAssert, expectedOptions, expectedReply) {
    console.log('arguments received:', methodToAssert.mock.calls);
    console.log('expected arguments:', expectedOptions);
    expect(methodToAssert).toHaveBeenCalledWith(...expectedOptions);
    expect(interaction.reply).toHaveBeenCalledWith(expectedReply);
}

// Helper function to assert the failure of a command due to insufficient permissions
function assertInsufficientPermissions(interaction, methodToAssert) {
    expect(interaction.reply).toHaveBeenCalledWith({ content: 'You don\'t have permission for that!', ephemeral: true});
    expect(methodToAssert).not.toHaveBeenCalled();
}