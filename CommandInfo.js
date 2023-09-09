const { SlashCommandBuilder } = require('@discordjs/builders');
const hentaiCollection = require('./HentaiCollection');

module.exports.data = () => {
    const commandList = [
        new SlashCommandBuilder()
            .setName('help')
            .setDescription('Show you command list of this bot.'),
        new SlashCommandBuilder()
            .setName('changebanner')
            .setDescription('Select a random server banner in banner channel. You can use this only in banner channel'),
        buildMentionCommand('natsumikan', 'leader Usio'),
        buildMentionCommand('n', 'leader Natsumikan'),
        buildMentionCommand('hal', 'bot manager HAL9000'),
        buildMentionCommand('h', 'bot manager HAL9000'),
        buildMentionCommand('mogtam', 'admin Mogtam'),
        buildMentionCommand('m', 'admin Mogtam'),
    ];
    for (const command of hentaiCollection.getHentaiCommands())
        commandList.push(command);
    return commandList;
};

function buildMentionCommand(cmdName, mentionName) {
    return new SlashCommandBuilder()
        .setName(cmdName)
        .setDescription(`Mention to the ${mentionName}. Don\'t abuse this.`)
        .addStringOption(option =>
            option.setName('m')
                .setDescription(`Message to the ${mentionName}`)
        );
}