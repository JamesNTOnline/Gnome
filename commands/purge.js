const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

//TODO: refactor into a proper subcommand with options for role ID and message count threshold

function loadMessageCounts(filePath) {
    const counts = {};
    if (!fs.existsSync(filePath)) return counts;
    const lines = fs.readFileSync(filePath, 'utf8').split('\n').slice(1); // skip header
    for (const line of lines) {
        if (!line.trim()) continue;
        const [userId, , count] = line.split(',');
        counts[userId] = parseInt(count, 10) || 0;
    }
    return counts;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('purge in progress...'),
    async execute(interaction) {
        // Set your role ID here:
        const roleId = '';

        await interaction.reply('purge in progress...');

        const filePath = path.resolve(__dirname, '..', 'messages_report.txt');
        const messageCounts = loadMessageCounts(filePath);

        const role = await interaction.guild.roles.fetch(roleId);
        if (!role) {
            await interaction.followUp('Role not found!');
            return;
        }

        const members = await interaction.guild.members.fetch();
        const roleMembers = members.filter(member => member.roles.cache.has(roleId));
        let toKick = [];

        for (const member of roleMembers.values()) {
            const count = messageCounts[member.id] || 0;
            if (count < 5) {
                toKick.push(member);
            }
        }

        let kicked = 0;
        for (const member of toKick) {
            try {
                // Remove the role before kicking
                await member.roles.remove(roleId);
                await member.kick();
                kicked++;
                console.log(`Removed role and kicked ${member.user.tag} (${member.id}), messages: ${messageCounts[member.id] || 0}`);
            } catch (err) {
                console.error(`Failed to remove role/kick ${member.user.tag} (${member.id}):`, err);
            }
        }

        await interaction.followUp(`Done! Kicked ${kicked} inactive users with the role.`);
    }
};