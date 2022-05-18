const { SlashCommandBuilder } = require('@discordjs/builders');
const hmfull = require('hmfull'); // https://www.npmjs.com/package/hmfull
const Neko = require('nekos.life'); // https://www.npmjs.com/package/nekos.life
const Loli = require('lolis.life'); // https://www.npmjs.com/package/lolis.life

const nekoClient = new Neko();
const loliClient = new Loli();

// NekosとHMfullがバージョンアップ. 今なら使えるか？

const category2api = {
    kenzen: [
        // async () => hmfull.HMtai.sfw.wallpaper()['url'],
        async () => hmfull.HMtai.sfw.mobileWallpaper()['url'],
        async () => hmfull.HMtai.sfw.neko()['url'],
        async () => hmfull.HMtai.sfw.jahy()['url'],
        async () => hmfull.HMtai.nsfw.zettaiRyouiki()['url'],
        // async () => (await hmfull.Nekos.sfw.pat())['url'],
        async () => (await hmfull.Nekos.sfw.neko())['url'],
        // hmfull.Nekos.sfw.kitsune(),
        // hmfull.Nekos.sfw.waifu(),
        // async () => (await hmfull.NekoBot.sfw.kanna())['url'],
        async () => (await hmfull.NekoBot.sfw.neko())['url'],
        // async () => (await hmfull.NekoBot.sfw.holo())['url'],
        async () => (await hmfull.NekoBot.sfw.kemonomimi())['url'],
        // async () => hmfull.NekoBot.sfw.coffee(), violence?
        // async () => hmfull.NekoBot.sfw.gah(), violence
        // async () => (await hmfull.Miss.sfw.hug())['url'],
        // async () => hmfull.Miss.sfw.cry(), violence
        // async () => hmfull.Miss.sfw.kill(), violence
        // async () => (await hmfull.Miss.sfw.view())['url'], ERR
        // async () => (await hmfull.Miss.sfw.dance())['url'], ERR
    ],
    hentai: [
        async () => hmfull.HMtai.nsfw.hentai()['url'],
        async () => (await hmfull.NekoBot.nsfw.hentai())['url'],
        // async () => hmfull.NekoBot.nsfw.nekolewd()
        // async () => (await hmfull.Freaker.nsfw.hentai()) freaker is not compatible now
    ],
    // ahegao: [ DISTORTED
    //    async () => hmfull.HMtai.nsfw.ahegao()['url']
    // ],
    //ass: [ DISTORTED
    //    async () => hmfull.HMtai.nsfw.ass()['url'],
    //    // async () => (await hmfull.NekoBot.nsfw.anal())['url'] DISTORTED
    //],
    blowjob: [
        async () => hmfull.HMtai.nsfw.blowjob()['url'],
        // async () => (await hmfull.Nekos.nsfw.blowjob())['url'], UNDEFINED
        // async () => (await hmfull.Nekos.nsfw.bj())['url'], gif
    ],
    boobs: [
        async () => hmfull.HMtai.nsfw.boobjob()['url'],
        async () => (await hmfull.NekoBot.nsfw.boobs())['url'],
        async () => (await hmfull.NekoBot.nsfw.paizuri())['url'],
        // async () => (await hmfull.Miss.nsfw.boobs())['url'] UNDEFINED
    ],
    creampie: [
        async () => hmfull.HMtai.nsfw.creampie()['url']
    ],
    //cum: [ DISTORTED
    //    async () => hmfull.HMtai.nsfw.cum()['url'],
    //    //async () => (await hmfull.Nekos.nsfw.cumJpg())['url'] UNDEFINED
    //],
    elves: [
        async () => hmfull.HMtai.nsfw.elves()['url']
    ],
    ero: [
        async () => hmfull.HMtai.nsfw.ero()['url'],
        // async () => (await hmfull.Nekos.nsfw.ero())['url'], UNDEFINED
        // async () => (await hmfull.Miss.nsfw.ero())['url'] no response
    ],
    femdom: [
        async () => hmfull.HMtai.nsfw.femdom()['url'],
        // async () => (await hmfull.Nekos.nsfw.femdom())['url'] ERR
    ],
    //foot: [ DISTORTED
    //    async () => hmfull.HMtai.nsfw.foot()['url'],
    //    // async () => (await hmfull.Nekos.nsfw.erofeet())['url'] UNDEFINED
    //],
    // futanari: [ ERR
    //     async () => (await nekoClient.nsfw.futanari())['url']
    // ],
    //futanari: [
    //    async () => (await hmfull.Nekos.nsfw.futanari())['url']
    //],
    //gasm: [ small picture
    //    async () => (await hmfull.Nekos.nsfw.gasm())['url']
    //],
    gif: [
        // async () => hmfull.HMtai.sfw.lick()['url'], DISTORTED
        // async () => (await hmfull.Nekos.sfw.hug())['url'], DISTORTED
        // async () => (await hmfull.Nekos.sfw.kiss())['url'], DISTORTED
        // hmfull.Nekos.sfw.cry(), violence
        // async () => (await hmfull.Nekos.sfw.smug())['url'],
        //async () => (await hmfull.Miss.sfw.kiss())['url'],
        //async () => (await hmfull.Nekos.nsfw.anal())['url'],
        async () => hmfull.HMtai.nsfw.gif()['url'],
        //async () => (await hmfull.Nekos.nsfw.boobs())['url'],
        //async () => (await hmfull.Nekos.nsfw.hentai())['url'],
        //async () => (await hmfull.Nekos.nsfw.classic())['url'],
        //async () => (await hmfull.Nekos.nsfw.feet())['url'],
        //async () => (await hmfull.Nekos.nsfw.pwankg())['url']
    ],
    glasses: [
        async () => hmfull.HMtai.nsfw.glasses()['url']
    ],
    //kuni: [
    //async () => (await hmfull.Nekos.nsfw.kuni())['url'] // gif
    //],
    masturbation: [
        async () => hmfull.HMtai.nsfw.masturbation()['url']
    ],
    kemono: [
        // async () => hmfull.HMtai.nsfw.nsfwNeko()['url'],
        //async () => (await hmfull.Nekos.nsfw.neko())['url'],
        //async () => (await hmfull.Nekos.nsfw.erokitsu())['url'],
        //async () => (await hmfull.Nekos.nsfw.erokemo())['url'],
        //async () => (await hmfull.Nekos.nsfw.lewdkitsu())['url'],
        async () => (await hmfull.Nekos.nsfw.lewdneko())['url'],
        // async () => (await hmfull.Nekos.nsfw.foxgirl()), // 404 not found :(
        async () => (await hmfull.NekoBot.nsfw.lewdneko())['url'],
        async () => (await hmfull.NekoBot.nsfw.kitsune())['url']
    ],
    //loli: [ no response
    //    async () => (await loliClient.getNSFWLoli())//['url']
    //],
    //loli_sfw: [ no response
    //    async () => (await loliClient.getSFWLoli())//['url']
    // ],
    //orgy: [ violent
    //    async () => hmfull.HMtai.nsfw.orgy()['url']
    //],
    pantsu: [
        async () => hmfull.HMtai.nsfw.pantsu()['url']
    ],
    //public: [ violent
    //    async () => hmfull.HMtai.nsfw.public()['url']
    //],
    //shota: [ StringOption limit :(
    //    async () => (await loliClient.getSFWShota())['url']
    // ],
    tentacles: [
        async () => hmfull.HMtai.nsfw.tentacles()['url'],
        async () => (await hmfull.NekoBot.nsfw.tentacle())['url']
    ],
    thighs: [
        async () => hmfull.HMtai.nsfw.thighs()['url'],
        async () => (await hmfull.NekoBot.nsfw.thigh())['url']
    ],
    trap: [ // however she is male
        async () => (await hmfull.Nekos.nsfw.trap())['url']
    ],
    uniform: [
        async () => hmfull.HMtai.nsfw.uniform()['url']
    ],
    yuri: [
        //async () => (await hmfull.Nekos.nsfw.eroyuri())['url'],
        //async () => (await hmfull.Nekos.nsfw.lesbian())['url'],
        //async () => (await hmfull.Nekos.nsfw.yuri())['url'],
        // async () => (await hmfull.Nekos.eroyuri())['url'],
        async () => (await hmfull.NekoBot.nsfw.yuri())['url']
    ]
};

module.exports.getHentaiCommands = () => {
    const builder0 = new SlashCommandBuilder();
    builder0.setName('hentai').setDescription('Only in nsfw channel. Show r18 image in the current channel.');
    builder0.addStringOption(option => {
        option.setName('category')
            .setDescription('Specify the type of image')
            .setRequired(false);
        // const choiceArray = []; not work option.addChoices(choiceArray);
        for (const category of Object.keys(category2api))
            if (!category.match(/kenzen|hentai|loli_sfw/)) {
                const obj = { name: category, value: category };
                option.addChoices(obj);
            }
        return option;
    });
    const builder1 = new SlashCommandBuilder();
    builder1
        .setName('kenzen')
        .setDescription('Only in nsfw channel. Show r18 image in the current channel.')
        /*.addStringOption(option =>
            option.setName('category')
                .setDescription('Specify the type of image')
                .setRequired(false)
                .addChoices({ name: 'loli', value:'loli_sfw'})
        )*/;

    return [builder0, builder1];
};

module.exports.getRandomUrl = async (category, pastMessages, retryLimit) => {
    if (category == null)
        category = 'hentai';
    else if (typeof (category) === 'string' && category.length <= 0)
        category = 'hentai';
    const messageHistory = [];
    pastMessages
        .fetch({ limit: 30 })
        .then(messages => {
            messages.forEach(message => {
                if (message.author.bot != null)
                    messageHistory.push(message.content);
            });
        });

    let url = 'no image for you';
    for (let i = 0; i < retryLimit; i++) {
        const temp = getUrl(category);
        if (!(await messageHistory).includes(temp) && temp != null) {
            url = temp;
            break;
        }
    }
    return url;
};

module.exports.specifiedCall = async (category, index, count, channel) => {
    if (!count)
        count = 1;
    for (let i = 0; i < count; i++) {
        if (index != null && index !== '-1')
            channel.send(category2api[category][index] ?? 'null');
        else
            for (const getter of category2api[category] ?? [])
                channel.send(await getter());
    }
};

module.exports.sendAll = async () => {
    const length = Object.keys(category2api).length;
    for (let i = 0; i < length; i++) {
        const keyStr = Object.keys(category2api)[i];
        console.log("");
        console.log("---" + keyStr + ":");
        let counter = 0;
        for (const getter of category2api[keyStr]) {
            // remove await if you want to check whether it is a promise function
            try {
                const value = await getter();
                console.log(counter + ': ' + value);
            } catch (error) {
                console.log('error');
            }
            counter++;
        }
    }
}

async function getUrl(category) {
    const candidates = category2api[category];
    if (candidates != null && candidates.length >= 1) {
        const obj = await candidates[Math.floor(Math.random() * candidates.length)]();
        return obj;
    }
    else
        return 'invalid category:' + category;
}