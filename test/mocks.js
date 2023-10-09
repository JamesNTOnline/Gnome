const { Collection } = require('discord.js');


/**
 * Commands in discord make API requests for different entities to operate on so it cant be tested
 * on directly.
 * In order to test a discord.js mock any entities and the values associated
 * with them in this file
 * 
 * documentation here: https://discord.js.org/#/docs/discord.js/main/class/Guild
 */

const memberMock = {
    id: 'target',
    username: 'TargetUser',
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

//could consolidate with member and mock different behaviours in tests
const adminMock = {
    id: 'admin',
    displayAvatarURL: jest.fn().mockReturnValue('https://cdn.discordapp.com/admin_avatar.jpg'),
    permissions: {
        has: jest.fn().mockReturnValue(true),
    }
};


module.exports = {
    memberMock,
    guildMock,
    adminMock,
};