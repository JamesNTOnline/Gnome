const fs = require('fs');
const path = require('path');

const holidays = [
    { name: 'christmas', month: 12, start: 15, end: 31 },
    { name: 'easter', month: 3, start: 15, end: 31 },
    { name: 'halloween', month: 10, start: 15, end: 31 }
];

function getSeason(month) {
    const seasons = ['winter', 'spring', 'summer', 'autumn'];
    return seasons[Math.floor(((month - 1) / 3) % 4)];
}

function getAvatarPath() {
    const avatarsPath = path.resolve(__dirname, '..', 'avatars');
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    const holiday = holidays.find(h => month === h.month && day >= h.start && day <= h.end);
    const timeOfYear = holiday ? holiday.name : getSeason(month);
    const folders = holiday ? [timeOfYear] : [timeOfYear, 'random'];
    const selectedFolder = folders[Math.floor(Math.random() * folders.length)];
    const folderPath = path.join(avatarsPath, selectedFolder);
    const files = fs.readdirSync(folderPath);
    const selectedFile = files[Math.floor(Math.random() * files.length)];
    return path.join(folderPath, selectedFile);
}

async function rotateAvatar(client) {
    const minIntervalMs = 3600000; // 1 hour in milliseconds
    const configPath = path.resolve(__dirname, '..', 'botconfig.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const now = Date.now();
    if (!config.lastAvatarChange || now - config.lastAvatarChange > minIntervalMs) {
        try {
            const avatarPath = getAvatarPath();
            await client.user.setAvatar(avatarPath);
            console.log(`Changed avatar to ${path.basename(avatarPath)}`);
            config.lastAvatarChange = now;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error('Error changing avatar:', error);
        }
    } else {
        const mins = Math.ceil((minIntervalMs - (now - config.lastAvatarChange)) / 60000);
        console.log(`Avatar change skipped: wait ${mins} more minute(s).`);
    }
}

module.exports = rotateAvatar;