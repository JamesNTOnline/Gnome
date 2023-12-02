// const {Events} = require('discord.js');

// module.exports = {
//     name: Events.ClientReady, //this event is for the clientready file
//     once: true, //run once
//     execute(client){
//         console.log(`Startup successful! Logged in as ${client.user.tag}`);
//     }
// };


const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

const avatarsPath = path.resolve(__dirname, '..', 'avatars');

//holiday periods and their timings. expand later
const holidays = [ //adjust the timings here e.g. christmas runs from dec 15th to 31st
    { name: 'christmas', month: 12, start: 15, end: 31 },
    { name: 'easter', month: 3, start: 15, end: 31 },
    { name: 'halloween', month: 10, start: 15, end: 31 }
];

/**
 * Selects a season based on the provided month:
 * - Winter: December, January, February 
 * - Spring: March, April, May... and so on
 * @param {number} month - The month (1 to 12)
 * @returns {string} - The name of the season
 */
function getSeason(month) {
    const validMonth = Math.max(1, Math.min(month, 12)); //constrain to 1-12 incase this function is used elsewhere
    const seasons = ['winter', 'spring', 'summer', 'autumn'];
    return seasons[Math.floor((validMonth/3) % 4)]; //e.g: (12/3) % 4 = 0 = seasons[0] = 'winter'
}


async function setAvatar(client) {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1; //months are 0-indexed
    const day = currentDate.getDate();
    let timeOfYear;

    //find out if it's a holiday and select either a holiday or season
    const holiday = holidays.find(h => month === h.month && day >= h.start && day <= h.end);
    timeOfYear = holiday ? holiday.name : getSeason(month);
    //if it isn't a holiday, include the random folder
    const folders = holiday ? [timeOfYear] : [timeOfYear, 'random'];
    const selectedFolder = folders[Math.floor(Math.random() * folders.length)]; //select folder randomly
    const folderPath = path.join(avatarsPath, selectedFolder);
    const files = fs.readdirSync(folderPath);
    const selectedFile = files[Math.floor(Math.random() * files.length)]; //select a file randomly
    //set bot's avatar
    const avatarPath = path.join(folderPath, selectedFile);
    try {
        await client.user.setAvatar(avatarPath);
        console.log(`Changed avatar to ${selectedFile}`);
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Startup successful! Logged in as ${client.user.tag}`);
        setAvatar(client);
        // Optionally, you can keep the setInterval for periodic avatar changes here as well
        setInterval(() => {
            setAvatar(client);
        }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    }
};
