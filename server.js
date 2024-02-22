// git add .
// git commit -m "message"
// git push origin main

const express = require('express');
const querystring = require('querystring');
const { Client, GatewayIntentBits, IntentsBitField, Channel, ContextMenuCommandBuilder, ApplicationCommandType} = require('discord.js');
const pinger = require('minecraft-server-ping');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const hentaiCollection = require('./HentaiCollection');
const remotecmd = require('./remotecmd');

const BOT_TOKEN = process.env.BOT_TOKEN;
const NATSUMIKAN_ID = process.env.NATSUMIKAN_ID;
const HAL_ID = process.env.HAL_ID;
const MOGTAM_ID = process.env.MOGTAM_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TESTSERVER_GUILD_ID = process.env.TESTSERVER_GUILD_ID;
const YAMATO_HOST = process.env.YAMATO_HOST;
const YAMATO_USERNAME = process.env.YAMATO_USERNAME;
const YAMATO_PRIVATEKEY = process.env.YAMATO_PRIVATEKEY;
const CMD_MCSTART = process.env.CMD_MCSTART;
const EXPRESS_PASSWORD = process.env.EXPRESS_PASSWORD;
const RETRY_LIMIT = 2;
const PREFIX = "/";
const BANNER_CHANNEL_ID = '976506255092875335';
const AFK_CHANNEL_ID = '974999731317141534';
const MCSERVER_CHANNEL_ID = '1150066815142219776';
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });
const app = express();
const expressPort = process.env.PORT || 3001;
const commands = [];
let mcServerChannel;
let bannerCollection = [];
const punishments = ['対応不可 :regional_indicator_r::regional_indicator_j:',
    'サイレンス完了:regional_indicator_s:', '警告完了:regional_indicator_w:',
    'ADM報告完了:regional_indicator_a:', 'CRF取り下げ完了:regional_indicator_t:'
    , '確認中:regional_indicator_c:', 'BAN完了:regional_indicator_c:'];
const vcShovelUsers = []; // = new string[guildId+channel.name][author.id]

app.get("/", (req, res) => { res.status(200).send("Demo!!!"); });
app.post("/", (req, res) => {
    if (req.method == 'POST') {
        let data = '';
        req.on('data', (chunk) => {
            data += chunk;
        });
        req.on('end', () => {
            if (!data) {
                console.log('No post data');
                res.end();
                return;
            }
            // console.log("raw data: " + data);
            const expressPassword = `password=${EXPRESS_PASSWORD}&logUpdate=`;
            // console.log("password: " + expressPassword);
            if (data.indexOf(expressPassword) == 0) {
                // This is a log update of mc server
                let log = data.substring(expressPassword.length);

                if (log.length >= 1) {
                    // const channel = client.guilds.cache.get(TESTSERVER_GUILD_ID).channels.cache.get("954734232125714465");
                    if (mcServerChannel)
                        mcServerChannel.send(log);
                }
                res.end();
                return;
            } else {
                // This is a generic post with URL query
                const dataObject = querystring.parse(data);
                console.log(`post: ` + dataObject.type);
                if (dataObject.type === 'wake') {
                    console.log('Woke up in post');
                } else if (dataObject.type == 'daychange') {
                    console.log('Day has changed');
                    updateBannerCollection().then(() => { setRandomBanner(null); });
                }
                res.end();
                return;
            }
        });
    }
});
const server = app.listen(expressPort, () => console.log(`Example app listening on port ${expressPort}!`));

client.on("ready", argClient => {
    console.log('On ready event');
    client.user.setActivity('Input slash / to view the command list', { type: 'PLAYING' });
    updateBannerCollection();
    mcServerChannel = client.guilds.cache.get(GUILD_ID).channels.cache.get(MCSERVER_CHANNEL_ID);
    remotecmd.connect(YAMATO_HOST, YAMATO_USERNAME, YAMATO_PRIVATEKEY);
});

client.on('messageCreate', async msg => {
    if (msg.author.bot) return;
    if (msg.member.voice.channel && msg.channel.name.includes('vc')) { // TODO vcチャンネルかどうかの判断があまりに適当同じ階層に同じ名前のvcがあるかで確認したい
        // Remind the author as shovel user if he uses it.
        // TODO vcの埋め込み型テキストチャンネルでも反応するようにしたい
        const urlPattern = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
        const channelName = msg.guildId + msg.channel.name;
        const authorId = msg.author.id;
        console.log('text info: channelName[' + channelName + "]: authorId[" + authorId + "] include:" + !!vcShovelUsers[channelName]);
        if (msg.content.trim().indexOf('!sh') === 0) {
            if (!vcShovelUsers[channelName]) {
                vcShovelUsers[channelName] = [authorId];
                console.log('made new shovel users array + ' + vcShovelUsers);
            }
        } else if (vcShovelUsers[channelName] && !vcShovelUsers[channelName].includes(authorId) && !urlPattern.test(msg.content)) {
            console.log('new shovel user is detected in:' + channelName);
            vcShovelUsers[channelName].push(authorId);
        }
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
    if (!interaction.isChatInputCommand())
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
        case 'server':
            if (await permissionCheck(interaction.guild.members.cache.get(interaction.user.id), true) && interaction.channelId === MCSERVER_CHANNEL_ID) {
                const subcommand = interaction.options.getSubcommand();
                if (subcommand === 'start') { // A shortcut to inject mc server start command
                    // let result = await remotecmd.inject(CMD_MCSTART);
                    remotecmd.inject(makeTmuxCommand('\"bash /home/opc/greg1.12.2/run.sh\"', 'mc'))
                    await interaction.reply('Requsted start command');
                }
                else if (subcommand === 'cmd' && interaction.user.id === HAL_ID) { // The way to inject normal linux commands
                    const order = interaction.options.getString('c', true);
                    remotecmd.inject(order);
                    /*
                    if (!(result && result.length >= 1))
                        result = "No response";
                    let title = '> Result:';
                    if (result.length > 1000) {
                        title = '> Result:Too long so cutted';
                        result = result.substring(0, 1000);
                    }*/
                    await interaction.reply(`<@${interaction.user.id}> try executing: ${order}`);
                    //interaction.channel.send(result.length >= 1 ? result : "Empty response");
                }
                else if (subcommand === 'tmux') { // A shortcut to inject tmux command for minecraft server
                    let cmd = interaction.options.getString('c', true);
                    remotecmd.inject(makeTmuxCommand(cmd, 'mc'));
                    await interaction.reply('Requested tmux command');
                }
                else if (subcommand === 'stop') {
                    remotecmd.inject(makeTmuxCommand('stop', 'mc'));
                    await interaction.reply('Requested stop command');
                }
                else if (subcommand === 'palstart') {
                    remotecmd.inject(makeTmuxCommand('~/emu/palstart.sh', 'pal'));
                    await interaction.reply('Requested pal server start command');
                }
                else {
                    await interaction.reply('Nothing happened');
                }
            }
            else {
                interaction.reply('You are not allowed to use this command');
            }
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

client.on('interactionCreate', async interaction => {
    if (!interaction.isMessageContextMenuCommand()) return;
    const { message } = interaction.targetMessage;
    message.pinned = true;
    interaction.reply('Pinned this message');
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

client.on("voiceStateUpdate", async (oldState, newState) => {
    if (newState && oldState) {

        /*
        if (oldState.channelId === newState.channelId) {
            // ミュートなどの動作を行ったとき
            console.log(`other`);
        }
        if (oldState.channelId === null && newState.channelId != null) {
            // connectしたとき
            console.log(`connect`);
        }*/
        if (oldState.channelId != null && newState.channelId === null) {
            // disconnectしたとき
            const channelName = oldState.guild.id + oldState.channel.name;
            console.log(`disconnect: ` + channelName);
            if (vcShovelUsers[channelName]) {
                const user = await oldState.guild.members.fetch(oldState.id);
                if ((user.user.bot && user.displayName.includes('shovel')) || oldState.channel.members.size <= 1) { // shovelが抜けることが確定しているので、登録を解除するだけでいい
                    console.log('delete shovel users array which are not used: ' + channelName);
                    delete vcShovelUsers[channelName];
                }
                else {
                    vcShovelUsers[channelName] = vcShovelUsers[channelName].filter(n => n !== oldState.id);
                    if (vcShovelUsers[channelName].length <= 0) {
                        console.log('Kick shovel as all users has left');
                        delete vcShovelUsers[channelName];
                        oldState.channel.members.find(member => {
                            if (member.user.bot && member.user.username.includes('shovel')) {
                                oldState.channel.send(member.user.username + 'を自動的に切断させました');
                                member.voice.disconnect();
                            }
                        });
                    }
                }
            }
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

function makeTmuxCommand(cmd, tmuxId) {
    return `tmux send-keys -t ${tmuxId}.0 ${cmd} ENTER`;
}