//reusable objects
const { Client, GatewayIntentBits, PermissionsBitField, Collection } = require('discord.js');
const { token } = require('../botconfig.json');
const moderation = require('../commands/moderation.js');
const { memberMock, guildMock, adminMock } = require('./mocks.js');


function setupClient() {
    const clientMock = new Client({
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

    return clientMock;
}

let clientMock; // represents the bot


// beforeAll, beforeEach, afterAll, afterEach must be at the top level of the code
beforeAll(async () => {
    clientMock = setupClient();
    await clientMock.login(token);
    await new Promise((resolve) => {
        clientMock.once('ready', () => {
            resolve();
        });
    });
});

afterAll(async () => {
    await clientMock.destroy();
});

beforeEach(() =>{ // reset anything which might be changed before each test or later tests can fail
    guildMock.members.ban.mockReset();
    guildMock.members.kick.mockReset();
})



/**
 * Sets up an interaction object for testing purposes. See the documentation for what might need to be included
 * @param {Client} client - The Discord.js client instance.
 * @param {string} subcommand - The subcommand for the interaction.
 * @param {string} reason - The reason value for the interaction.
 * @param {number} deleteValue - The delete value for the interaction.
 * @returns {Object} The configured interaction object.
 */
function setupMockInteraction(client, subcommand, reason, deleteValue) {
    const interaction = {
        id: '123456789',
        guildId: '580797956983226379',
        channelId: '1048732929473384538',
        guild: guildMock,
        member: adminMock,
        client: client,
        options: { //any expected command options go here
            getSubcommand: jest.fn().mockReturnValue(subcommand),
            getUser: jest.fn().mockReturnValue(memberMock),
            getString: jest.fn().mockReturnValue(reason),
            getInteger: jest.fn().mockReturnValue(deleteValue),
        },
        // mock interaction api functions here
        reply: jest.fn(), 
        deleteReply: jest.fn(),
        followUp: jest.fn(),
    };
    return interaction;
}


describe('Ban functionality', () => {

    test('ADMIN bans SERVER MEMBER', async () => {
        //console.log(clientMock);
        const interactionMock = setupMockInteraction(clientMock, 'ban', 'Reason for ban', 86400);

        // Assert that the fetch method of guildMock.bans is called
        moderation.execute(interactionMock);
        assertSuccessfulCommandExecution(
            interactionMock,
            guildMock.members.ban,
            [memberMock, { deleteMessageSeconds: 86400, reason: 'Reason for ban' }],
            '**Banned** target id: Reason for ban'
        );
    });


    test('tryBanUser functionality', async () => {
        // const cmdName = 'ban';
        // const reason = 'Reason for ban';
        // const time = 86400;
        // const interactionMock = setupMockInteraction(clientMock, cmdName, reason, time);
        // const checkIfBannedSpy = jest.spyOn(moderation, 'checkIfBanned');
        // checkIfBannedSpy.mockResolvedValue(false); 
        // jest.spyOn(moderation, 'tryBanUser').mockResolvedValue(true);
        // const success = await moderation.tryBanUser(interactionMock, memberMock, cmdName, reason, time);
        // expect(checkIfBannedSpy).toHaveBeenCalledWith(interactionMock, memberMock);
        // // Assert that the result is true
        // expect(success).toBe(true);
    });


    test('ADMIN bans BANNED USER', async () => {
        // mock object for the banned member
        // const bannedMember = { id: '123456789', user: { username: 'BannedUser' } };
        // return a mock collection containing the banned member
        // interactionMock.guild.bans.fetch = jest.fn().mockResolvedValue(new Collection([[bannedMember.id, bannedMember]]));
        // expect(interactionMock.guild.bans.fetch().get(bannedMember.id)).toEqual(bannedMember);
    });


    test('ADMIN unbans BANNED USER', async () => { });


    test('ADMIN unbans NOT-BANNED USER', async () => { }); //


    test('BOT bans SELF', async () => {
        const interactionMock = setupMockInteraction(clientMock, 'ban', 'Reason for ban', 0);
        // set target ID to be the same as the client's user ID
        interactionMock.options.getUser.mockReturnValue({
            id: clientMock.user.id,
            displayAvatarURL: jest.fn().mockReturnValue(clientMock.user.defaultAvatarURL),
        });
        await moderation.execute(interactionMock);

        expect(interactionMock.reply).toHaveBeenCalledWith({ content: 'I can\'t Gnome myself!', ephemeral: true });
        expect(guildMock.members.ban).not.toHaveBeenCalled();
    });


    test('USER bans SELF', async () => {
        const interactionMock = setupMockInteraction(clientMock, 'ban', 'Reason for ban', 0);
        // Set the target ID to be the same as the command caller's ID
        interactionMock.options.getUser.mockReturnValue(adminMock);
        await moderation.execute(interactionMock);

        expect(interactionMock.reply).toHaveBeenCalledWith({ content: 'I can\'t help you Gnome yourself!', ephemeral: true });
        expect(guildMock.members.ban).not.toHaveBeenCalled();

    });


    test('USER bans WITHOUT PERMS', async () => {
        adminMock.permissions.has.mockImplementation((flag) => {
            return flag === PermissionsBitField.Flags.BanMembers ? false : true;
        });
        const interactionMock = setupMockInteraction(clientMock, 'ban', 'Reason for ban', 0);
        await moderation.execute(interactionMock);
        assertInsufficientPermissions(interactionMock, guildMock.members.ban);
    });

});


describe('Kick functionality', () => {

    test('ADMIN kicks SERVER MEMBER', async () => {
        const interactionMock = setupMockInteraction(clientMock, 'kick', 'Reason for kick', 0);

        await moderation.execute(interactionMock);

        assertSuccessfulCommandExecution(
            interactionMock,
            guildMock.members.kick,
            [memberMock, 'Reason for kick'],
            '**Kicked** target id: Reason for ban'
        );
    });


    test('ADMIN kicks OUTSIDE USER', async () => { });


    test('BOT kicks SELF', async () => { });


    test('USER kicks SELF', async () => { });


    test('USER kicks WITHOUT PERMS', async () => {
        adminMock.permissions.has.mockImplementation((flag) => {
            return flag === PermissionsBitField.Flags.KickMembers ? false : true;
        });
        const interactionMock = setupMockInteraction(clientMock, 'kick', 'Reason for kick', 0);
        await moderation.execute(interactionMock);
        assertInsufficientPermissions(interactionMock, guildMock.members.kick);
    });

});


function assertSuccessfulCommandExecution(interaction, methodToAssert, expectedOptions, expectedReply) {
    //console.log('arguments received:', methodToAssert.mock.calls);
    //console.log('expected arguments:', expectedOptions);
    expect(methodToAssert).toHaveBeenCalledWith(...expectedOptions);
    expect(interaction.reply).toHaveBeenCalledWith(expectedReply);
}


function assertInsufficientPermissions(interaction, methodToAssert) {
    expect(interaction.reply).toHaveBeenCalledWith({ content: 'You don\'t have permission for that!', ephemeral: true });
    expect(methodToAssert).not.toHaveBeenCalled();
}