const http = require('http');
const querystring = require('querystring');
const { Client, Intents } = require('discord.js');
const nomlish = require('nomlish');
const pinger = require('minecraft-server-ping');
const kuromoji = require('kuromoji');
const fs = require('fs'); // filesystem module
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const hentaiCollection = require('./HentaiCollection');

const BOT_TOKEN = process.env.BOT_TOKEN;
const USIO_ID = process.env.USIO_ID;
const NATSUMIKAN_ID = process.env.NATSUMIKAN_ID;
const HAL_ID = process.env.HAL_ID;
const MOGTAM_ID = process.env.MOGTAM_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TESTSERVER_GUILD_ID = process.env.TESTSERVER_GUILD_ID;
const RETRY_LIMIT = 2;
const PREFIX = "/";
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const commands = [];
const kuromojiBuilder = kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' });
const wordMap = {};
const punishments = ['対応不可 :regional_indicator_r::regional_indicator_j:',
    'サイレンス完了:regional_indicator_s:', '警告完了:regional_indicator_w:',
    'ADM報告完了:regional_indicator_a:', 'CRF取り下げ完了:regional_indicator_t:'
    , '確認中:regional_indicator_c:', 'BAN完了:regional_indicator_c:']

// Glitch上で動かすとき一定時間経過でスリープする仕様がある。これを阻止するため、Google Apps Scriptから強制的にたたき起こす
http.createServer((req, res) => {
    if (req.method == 'POST') {
        let data = '';
        req.on('data', (chunk) => {
            data += chunk;
        });
        req.on('end', () => {
            if (data != null) {
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
});

client.on('messageCreate', async msg => {
    if (msg.author.bot == null) return;
    if (msg.content.indexOf(PREFIX) === 0) {
        const parts = msg.content.slice(PREFIX.length).trim().split(/ +/g);
        const title = parts.shift().toLowerCase();

        switch (title) {
            case 'nomlish':
                const arg = parts.shift();
                if (arg === undefined) {
                    const sentence = makeSentence();
                    nomlish.translate(sentence, 2).then((result) => {
                        if (result != null) {
                            msg.channel.send(`原文: ${sentence}
${result}`);
                        }
                        else // 翻訳不能の場合
                            msg.channel.send(`Failed to send Nomlish: ${result}`);
                    });
                }
                else {
                    nomlish.translate(parts.shift(), /*level*/2).then((result) => {
                        if (result != null)
                            msg.channel.send(result);
                        else // 翻訳不能の場合
                            msg.channel.send(`Failed to send Nomlish`);
                    });
                }
                break;
            case 'mss':
                // https://github.com/mharj/minecraft-ping
                const pastTime = Date.now();
                const ip = parts.shift();
                try {
                    const data = await pinger.ping(ip);
                    const currentTime = Date.now();
                    msg.channel.send(`Ping to ' + ${ip}
                    ${(currentTime - pastTime).toString()} ms`);
                } catch (error) {
                    msg.channel.send(`Failed to check ping to ${ip}
Didn\'t you mistake the minecraft server IP?`);
                }
                break;
            case 'analyze':
                kuromojiBuilder.build((err, tokenizer) => {
                    if (err)
                        throw err;
                    const tokens = tokenizer.tokenize(parts.shift());
                    msg.channel.send(JSON.stringify(tokens));
                });
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
            /*
            case 'debug0':
                console.log('called');
                if (msg.channel.nsfw) {
                    hentaiCollection.specifiedCall(parts.shift()?.toLowerCase(), parts.shift(), parts.shift(), msg.channel);
                }
                break;
            case 'debug1':
                if (msg.channel.nsfw) {
                    msg.channel.send('command request');
                    hentaiCollection.sendAll();
                }
                break;*/
        }
    }
    else {
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
                /ikenzen    (iPhone利用者向け)
                /analyze <日本語文章>`,
                ephemeral: true
            });
            break;
        case 'madness':
            await interaction.reply(makeSentence());
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
                const loli = interaction.options.getString('loli'); // actual category is loli_sfw
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
        case 'usio':
        case 'u':
            sendMention(USIO_ID, interaction.options.getString('m'), (message) => interaction.reply(message));
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
loadStoryData();

function loadStoryData() {
    console.log('Started loading story data');
    const sampleSentence = fs.readFileSync('./sampleSentence.txt').toString();
    console.log(sampleSentence.substr(0, 100));
    kuromojiBuilder.build((err, tokenizer) => { // build()は非同期で行われる
        if (err)
            throw err;
        const tokens = tokenizer.tokenize(sampleSentence);
        const tokenWords = tokens.filter(token => {
            return token.word_type === 'KNOWN'; // word_type===UNKNOWNの単語は変な奴が多いので除外する
        });

        // データを登録する
        for (let i = 0; i < tokenWords.length; i++) {
            let now = tokenWords[i]?.surface_form;
            if (now === undefined) now = null;
            let prev = tokenWords[i - 1]?.surface_form;
            if (prev === undefined) prev = null;

            let nowArray;
            if (wordMap[prev] === undefined)
                nowArray = (wordMap[prev] = []);
            else
                nowArray = wordMap[prev];
            // if (!nowArray.includes(now))
            nowArray.push(now);
        }

        console.log("Completed loading " + Object.keys(wordMap).length + " words");
    });
}

function chooseRandomWordAfter(word, wordCount) {
    let words = wordMap[word];
    if (words === undefined) words = [];

    // 。?!がある場合、それを選ぶ確立を格段に上げる。ただ文章の長さが短すぎないように、単語がある程度溜まったときのみ
    let endPossibility = [];
    if (words.includes('。'))
        endPossibility.push('。')
    if (words.includes('？'))
        endPossibility.push('？')
    if (words.includes('！'))
        endPossibility.push('！')
    if (endPossibility.length >= 1 && Math.random() >= 0.2 && wordCount >= 5)
        return endPossibility[Math.floor(Math.random() * endPossibility.length)];
    else
        return words[Math.floor(Math.random() * words.length)];
}

function makeSentence() {
    let sentence = [];
    let word = chooseRandomWordAfter(null, sentence.length);
    let limitCounter = 0;
    while (word && limitCounter < 333) {
        limitCounter++;
        sentence.push(word);
        if (word == '。' || word == '！' || word == '？')
            break;
        word = chooseRandomWordAfter(word, sentence.length);
    }
    return sentence.join('');
}

function sendMention(mentionId, content, sender) {
    let message = `<@${mentionId}>`;
    if (content != null)
        message += " " + content;
    sender(message);
}