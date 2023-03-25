// git add .
// git commit -m "message"
// git push origin main

const http = require('http');
const querystring = require('querystring');
const { Client, GatewayIntentBits  } = require('discord.js');
const pinger = require('minecraft-server-ping');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const hentaiCollection = require('./HentaiCollection');
const etherdb = require('./etherdb');

const BOT_TOKEN = process.env.BOT_TOKEN;
const NATSUMIKAN_ID = process.env.NATSUMIKAN_ID;
const HAL_ID = process.env.HAL_ID;
const MOGTAM_ID = process.env.MOGTAM_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TESTSERVER_GUILD_ID = process.env.TESTSERVER_GUILD_ID;
const RETRY_LIMIT = 2;
const PREFIX = "/";
const BANNER_CHANNEL_ID = '976506255092875335';
const AFK_CHANNEL_ID = '974999731317141534';
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const commands = [];
let bannerCollection = [];
const punishments = ['対応不可 :regional_indicator_r::regional_indicator_j:',
    'サイレンス完了:regional_indicator_s:', '警告完了:regional_indicator_w:',
    'ADM報告完了:regional_indicator_a:', 'CRF取り下げ完了:regional_indicator_t:'
    , '確認中:regional_indicator_c:', 'BAN完了:regional_indicator_c:'];
const vcTextSpeakers = []; // = new String[][]

// Glitch上で動かすとき一定時間経過でスリープする仕様がある。これを阻止するため、Google Apps Scriptから強制的にたたき起こす
http.createServer((req, res) => {
    if (req.method == 'POST') {
        let data = '';
        req.on('data', (chunk) => {
            data += chunk;
        });
        req.on('end', () => {
            if (data == null) {
                console.log('No post data');
                res.end();
                return;
            }
            const dataObject = querystring.parse(data);
            console.log(`post: ${dataObject.type}`);
            if (dataObject.type == 'wake') {
                console.log('Woke up in post');
                res.end();
                return;
            }
            if (dataObject.type == 'daychange') {
                console.log('Day has changed');
                updateBannerCollection().then(() => { setRandomBanner(null); });
                res.end();
                return;
            }
            res.end();
        });
    }
    else if (req.method == 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Discord Bot is active now\n');
    }
}).listen(3000);

client.on("ready", argClient => {
    console.log('On ready event');
    client.user.setActivity('Input slash / to view the command list', { type: 'PLAYING' });
    updateBannerCollection();
});

client.on('messageCreate', async msg => {
    if (msg.author.bot) return;
    let parent = msg.channel.parent;
    if (msg.content.trim().indexOf('!sh') === 0 && msg.guildId === TESTSERVER_GUILD_ID
        && typeof (parent) === "CategoryChannel" && parent.name.toLowerCase().indexOf("voice") >= 0) {
        console.log('someone used !sh');
        return;
    }
    if (msg.content.indexOf(PREFIX) === 0) {
        const parts = msg.content.slice(PREFIX.length).trim().split(/ +/g);
        const title = parts.shift().toLowerCase();

        switch (title) {
            case 'mss':
                // https://github.com/mharj/minecraft-ping
                const pastTime = Date.now();
                const ip = parts.shift();
                try {
                    const data = await pinger.ping(ip);
                    const currentTime = Date.now();
                    msg.channel.send(`Ping to ${ip}
                    ${(currentTime - pastTime).toString()} ms`);
                } catch (error) {
                    msg.channel.send(`Failed to check ping to ${ip}
Didn\'t you mistake the minecraft server IP?`);
                }
                break;
            case 'ihentai': // For those who can't use interaction commands
                if (msg.channel.nsfw) {
                    let category = parts.shift()?.toLowerCase();
                    if (category != null && category.includes('category:'))
                        category = category.match(/(?<=category:)(.*)/g)[0];
                    const url = await hentaiCollection.getRandomUrl(category, msg.channel.messages, RETRY_LIMIT);
                    msg.channel.send(url);
                }
                else
                    msg.channel.send('Oops, you can\'t see that in non nsfw channels!');
                break;
            case 'ikenzen':
                if (msg.channel.nsfw) {
                    let category = parts.shift()?.toLowerCase();
                    if (category == null)
                        category = 'kenzen';
                    else if (category != null && category.includes('category:'))
                        category = category.match(/(?<=category:)(.*)/g)[0];
                    const url = await hentaiCollection.getRandomUrl(category, msg.channel.messages, RETRY_LIMIT);
                    msg.channel.send(url);
                }
                else
                    msg.channel.send('Oops, you can\'t see that in non nsfw channels!');
                break;
            case 'debug0':
                console.log('called');
                if (msg.channel.nsfw && msg.author.id === HAL_ID) {
                    hentaiCollection.specifiedCall(parts.shift()?.toLowerCase(), parts.shift(), parts.shift(), msg.channel);
                }
                break;
            case 'debug1':
                if (msg.channel.nsfw && msg.author.id === HAL_ID) {
                    msg.channel.send('command request');
                    hentaiCollection.sendAll();
                }
                break;
            /*
            case 'debug2':
                if (msg.author.id === HAL_ID && msg.guildId === TESTSERVER_GUILD_ID) { // @everyoneは、削除しても通知が残ってた…どうしよう
                    const startMillisec = new Date();
                    while (new Date() - startMillisec < 5000);
                    msg.channel.send('@everyone');
                }*/
            case 'dbdebug':
                if (await permissionCheck(msg.guild.members.cache.get(msg.author.id), true))
                    etherdb.debug(msg.guildId, 'any');
                else
                    msg.channel.send('Not allowed to execute this command!');
                break;
            case 'setbanner':
                if (msg.author.id === HAL_ID) {
                    const url = "https://cdn.discordapp.com/attachments/904002699970891836/" + parts.shift();
                    msg.channel.send('the banner should have been changed');
                    await client.guilds.cache.get(GUILD_ID).setBanner(url);
                }
                break;
        }
        return;
    }

    let content = msg.content.replace(/理由：|理由:/, '理由:').replace(/ID:|ID：|ID：|ID:/, 'ID:');
    if (content.includes('理由:') && content.includes('ID:')) {

        let userid = msg.content.match(/(?<=ID:)(.*)/g)[0];
        if (userid.includes('理由:'))
            userid = userid.match(/(.*)(?=理由:)/g)[0];
        const report =
            `--------${punishments[Math.floor(Math.random() * punishments.length)]}--------
担当MOD: ${msg.author.username}
ユーザー名: ${userid}`;
        msg.channel.send(report);
        return;
    }

   
    // 同一絵文字を複数ユーザーが入力した場合、便乗して同じ絵文字を送る
    // 最新コメントで投稿された絵文字それぞれが、以前の別ユーザーの投稿でも2回使用されている場合に反応する
    const msgList = [];
    const emojiRegex = /((?<!\\)<:[^:]+:(\d+)>)|\p{Emoji_Presentation}|\p{Extended_Pictographic}/gmu; // before:'/[:]\w+[:]/g'
    // :ok:というメッセージから抽出できなかった. なんで？ 修正を加える必要がありそうだ
    await msg.channel.messages
        .fetch({ limit: 10 })
        .then(messages => {
            // console.log('-----');
            messages.forEach(message => { // 最新のメッセージから順に古いほうへと読み込まれる
                const foundEmojis = message.content.match(emojiRegex) ?? [];
                msgList.push({
                    array: foundEmojis,
                    userid: message.author.id,
                    isBot: !(!message.author.bot) // 汚い…
                });
                // console.log(message.content + '.Number: ' + foundEmojis.length);
            });
        });

    if (msgList.length > 0 && !msgList[0].isBot && Math.floor(Math.random() * 2) == 0) { // 鬱陶しいならここの確率を下げる
        let postStr = '';
        msgList[0].array.forEach(emoji => {
            const users = [];
            let matchCount = 0; //3以上になったらメッセージを送る.
            for (const lateMsg of msgList) {
                if (lateMsg.array.some(value => value === emoji)) {
                    if (lateMsg.isBot) {
                        matchCount = -99999; // あまりに力ずくな解決方法. もっとスマートな方法がいいなぁ
                    }
                    else if (!users.some(value => value === lateMsg.userid)) {
                        users.push(lateMsg.userid); // 一人だけのスパムでも反応させたいならここを削除する
                        matchCount++;
                    }
                }
            }
            // console.log('matchCount:' + matchCount);
            if (matchCount >= 3) {
                postStr += emoji;
            }
        });
        if (postStr.length > 0) {
            msg.channel.send(postStr);
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand())
        return;
    if (interaction.user.bot)
        return;
    switch (interaction.commandName) {
        case 'help':
            await interaction.reply({
                content: `一覧に表示されないコマンドのリストです。 <>は入力時には無視してください
                /nomlish <日本語文章>
                /mss <IPアドレスかドメイン>
                /ihentai    (iPhone利用者向け)
                /ikenzen    (iPhone利用者向け)`,
                ephemeral: true
            });
            break;
        case 'hentai':
            if (interaction.channel.nsfw) {
                const category = interaction.options.getString('category');
                if (category != null && category.includes('category:'))
                    category = category.match(/(?<=category:)(.*)/g)[0];
                if (category != null)
                    interaction.channel.send('/hentai category:' + category);
                else
                    interaction.channel.send('/hentai');
                const url = await hentaiCollection.getRandomUrl(category, interaction.channel.messages, RETRY_LIMIT);
                interaction.channel.send(url);
                await interaction.reply('success');
                await interaction.deleteReply();
            }
            else
                await interaction.reply('Oops, you can\'t see that in non nsfw channels!');
            break;
        case 'kenzen':
            if (interaction.channel.nsfw) {
                const loli = interaction.options.getString('category'); // actual category is loli_sfw
                if (loli != null) {
                    interaction.channel.send('/kenzen category:loli');
                    const url = await hentaiCollection.getRandomUrl(loli, interaction.channel.messages, RETRY_LIMIT);
                    interaction.channel.send(url);
                }
                else {
                    interaction.channel.send('/kenzen');
                    const url = await hentaiCollection.getRandomUrl('kenzen', interaction.channel.messages, 2);
                    interaction.channel.send(url);
                }
                await interaction.reply('success');
                await interaction.deleteReply();
            }
            else
                await interaction.reply('Oops, you can\'t see that in non nsfw channels!');
            break;
        case 'natsumikan':
        case 'n':
            sendMention(NATSUMIKAN_ID, interaction.options.getString('m'), (message) => interaction.reply(message));
            break;
        case 'hal':
        case 'h':
            sendMention(HAL_ID, interaction.options.getString('m'), (message) => interaction.reply(message));
            break;
        case 'mogtam':
        case 'm':
            sendMention(MOGTAM_ID, interaction.options.getString('m'), (message) => interaction.reply(message));
            break;
        case 'resetdatabase':
            if (!(await permissionCheck(interaction.guild.members.cache.get(interaction.user.id), true))) {
                await interaction.reply('You are not allowed!');
            }
            else {
                etherdb.resetDatabase(interaction.guildId);

                interaction.channel.send('Reset all the settings and data for me!');
                await interaction.reply('success');
                await interaction.deleteReply();
            }
            break;
        case 'setproperty':
            if (!(await permissionCheck(interaction.guild.members.cache.get(interaction.user.id), true))) {
                await interaction.reply('You are not allowed!');
                break;
            } else {
                await interaction.reply('success');
                await interaction.deleteReply();
            }
            break;
        case 'changebanner':
            if (interaction.guildId === GUILD_ID && permissionCheck(interaction.guild.members.cache.get(interaction.user.id, true))) {
                await updateBannerCollection();
                setRandomBanner(null);
                await interaction.reply('Re-register server banner images for ether. Wait a moment while I change the banner.');
            }
            else {
                await interaction.reply('You can\'t execute the command as your permission or channel');
            }
            break;
    }
});

/*
client.on('voiceStateUpdate', (oldMember, newMember) => {
    console.log('Help me plz');
    // このイベントが呼び出されていない?
    if (oldMember.channelId === null && newMember.channelId === AFK_CHANNEL_ID) {
        console.log('someone entered');
        newMember.member.roles.add(newMember.guild.roles.cache.find(role => role.name === 'AFK Noob'));
    }
});*/

client.on("voiceStateUpdate", (oldState, newState) => {
    if (newState && oldState) {
        //newState関係
        console.log(`NEW:userid   : ${newState.id}`);       //ユーザID
        console.log(`NEW:channelid: ${newState.channelID}`);//チャンネルID、nullならdisconnect
        console.log(`NEW:guildid  : ${newState.guild.id}`); //ギルドID

        //oldState関係
        console.log(`OLD:userid   : ${oldState.id}`);       //ユーザID
        console.log(`OLD:channelid: ${oldState.channelID}`);//チャンネルID、nullならconnect
        console.log(`OLD:guildid  : ${oldState.guild.id}`); //ギルドID

        if (oldState.channelID === newState.channelID) {
            //ここはミュートなどの動作を行ったときに発火する場所
            concole.log(`other`);
        }
        if (oldState.channelID === null && newState.channelID != null) {
            //ここはconnectしたときに発火する場所
            concole.log(`connect`);
        }
    if (oldState.channelID != null && newState.channelID === null) {
        //ここはdisconnectしたときに発火する場所
        console.log(`disconnect`);
        }
    }
});

const commandInfo = require('./CommandInfo');
for (const info of commandInfo.data())
    commands.push(info.toJSON());
const rest = new REST({ version: 9 }).setToken(BOT_TOKEN);
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, TESTSERVER_GUILD_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.login(BOT_TOKEN);

function sendMention(mentionId, content, sender) {
    let message = `<@${mentionId}>`;
    if (content != null)
        message += " " + content;
    sender(message);
}

async function permissionCheck(member, includeHal) {
    return member.roles.cache.some((role) => role.name === 'leader' || role.name === 'admin') || (member.id === HAL_ID && includeHal);
}

async function updateBannerCollection() {
    console.log('Reloading server banner images...');
    bannerCollection = [];
    const channel = client.guilds.cache.get(GUILD_ID).channels.cache.get(BANNER_CHANNEL_ID);
    await channel.messages
        .fetch({ limit: 100 })
        .then(messages => {
            messages.forEach(message => {
                if (!message.author.bot && message.attachments.size > 0) {
                    message.attachments.forEach(attachment => {
                        if (attachment.contentType.toLowerCase().includes('image'))
                            bannerCollection.push(attachment.url);
                    });
                }
            });
            console.log('Reloaded ' + bannerCollection.length + ' server banner images');
        });
}

function setRandomBanner(channel) {
    if (bannerCollection.length <= 0) {
        if (channel != null) {
            channel.send('No banner images are registered.'); // channel?.send('')の方がよい?
        }
        return;
    }
    const guild = client.guilds.cache.get(GUILD_ID);
    // 画像データをbase64(string)に変換し引数として渡したい setBanner(toDataURL('https://...'))
    // OR URLを渡すだけ
    const index = Math.floor(Math.random() * bannerCollection.length);
    guild.setBanner(bannerCollection[index]);
    console.log('Server banner has been changed to id:' + index);
}