const { Collection } = require('discord.js');

const memberMock = {
    id: 'target id',
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

const adminMock = {
    id: 'admin id',
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