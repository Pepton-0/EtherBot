const { SlashCommandBuilder } = require('@discordjs/builders');
const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const hentaiCollection = require('./HentaiCollection');

module.exports.data = () => {
    const commandList = [
        new SlashCommandBuilder()
            .setName('help')
            .setDescription('Show you command list of this bot.'),
        new SlashCommandBuilder()
            .setName('changebanner')
            .setDescription('Select a random server banner in banner channel. You can use this only in banner channel'),
        new SlashCommandBuilder()
            .setName('server')
            .setDescription('Send commands to yamato server')
            .addSubcommand(sub =>
                sub.setName('start')
                    .setDescription('Start mc server via tmux'))
            .addSubcommand(sub =>
                sub.setName('cmd')
                    .setDescription('Input any command')
                    .addStringOption(option =>
                        option.setName('c')
                            .setDescription('Command')))
            .addSubcommand(sub => 
                sub.setName('tmux')
                    .setDescription('Input command which is inserted in tmux')
                    .addStringOption(option =>
                        option.setName('c')
                            .setDescription('Command')))
            .addSubcommand(sub =>
                sub.setName('stop')
                    .setDescription('Stop mc server via tmux'))
            .addSubcommand(sub =>
                sub.setName('palstart')
                    .setDescription('Start pal server')),
        buildMentionCommand('natsumikan', 'leader Usio'),
        buildMentionCommand('n', 'leader Natsumikan'),
        buildMentionCommand('hal', 'bot manager HAL9000'),
        buildMentionCommand('h', 'bot manager HAL9000'),
        buildMentionCommand('mogtam', 'admin Mogtam'),
        buildMentionCommand('m', 'admin Mogtam'),
        new ContextMenuCommandBuilder()
            .setName('Pin this message')
            .setType(ApplicationCommandType.Message)
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