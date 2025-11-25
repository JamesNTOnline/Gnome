const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');


//TODO: refactor into a proper subcommand with options for channels and cutoff date

function readExistingTally(filePath) {
    const userTally = {};
    if (!fs.existsSync(filePath)) return userTally;
    const lines = fs.readFileSync(filePath, 'utf8').split('\n').slice(1); // skip header
    for (const line of lines) {
        if (!line.trim()) continue;
        const [userId, username, count] = line.split(',');
        userTally[userId] = { username, count: parseInt(count, 10) || 0 };
    }
    return userTally;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gathermessages')
        .setDescription('Gather all messages from specified channels'),
    async execute(interaction) {
        // Supply only the channels you want to process this run:
        //TODO: allow user to set channels via command options
        const channelIds = [
            '1216698620984954911'
        ];

        await interaction.reply('Starting message gathering and merging...');

        const filePath = path.resolve(__dirname, '..', 'messages_report.txt');
        const userTally = readExistingTally(filePath);
        let totalMessages = 0;

        // Calculate cutoff date
        //TODO: allow user to set cutoff via command option
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - 2);

        for (const channelId of channelIds) {
            const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
            if (!channel || !channel.isTextBased()) {
                console.log(`Channel ${channelId} not found or not text-based.`);
                continue;
            }

            console.log(`Processing channel: #${channel.name} (${channelId})`);
            let lastId;
            let reachedCutoff = false;
            let batchCount = 0;
            while (!reachedCutoff) {
                const options = { limit: 100 };
                if (lastId) options.before = lastId;
                let messages;
                try {
                    messages = await channel.messages.fetch(options);
                } catch (err) {
                    if (err.status === 429) {
                        console.warn('Rate limited! Waiting 2 seconds...');
                        await new Promise(res => setTimeout(res, 2000));
                        continue; // retry this batch
                    } else {
                        throw err;
                    }
                }
                if (messages.size === 0) break;

                for (const message of messages.values()) {
                    if (message.createdAt < cutoff) {
                        reachedCutoff = true;
                        break;
                    }
                    const user = message.author;
                    if (!userTally[user.id]) {
                        userTally[user.id] = { username: `${user.username}#${user.discriminator}`, count: 0 };
                    }
                    userTally[user.id].count += 1;
                    totalMessages++;
                }

                lastId = messages.last().id;
                batchCount++;
                console.log(`Fetched batch ${batchCount} (${messages.size} messages) from #${channel.name}`);

                // Write current tallies to file after each batch (merged)
                const lines = [];
                for (const [userId, data] of Object.entries(userTally)) {
                    lines.push(`${userId},${data.username},${data.count}`);
                }
                fs.writeFileSync(filePath, 'userid,username,count\n' + lines.join('\n') + '\n', 'utf8');

                await new Promise(res => setTimeout(res, 500));
            }
            console.log(`Finished channel: #${channel.name} (${channelId})`);
        }

        await interaction.followUp(`Done! Gathered ${totalMessages} new messages. Results merged into messages_report.txt`);
    }
};