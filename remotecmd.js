const { NodeSSH } = require('node-ssh');
const { connected } = require('process');
const connection = new NodeSSH();
let isConnected = false;

// connect to yamato's server
module.exports.connect = async(host, username, privateKey) => internalConnect(host, username, privateKey);

module.exports.inject = async(command) => internalInject(command);

async function internalConnect(host, username, privateKey) {
    if (connected)
        conenction.dispose();
    console.log('Start connecting to yamato\'s server...');
    await connection.connect({
        host: host,
        username: username,
        privateKey: privateKey
    });
    await connection.execCommand('ls', { options: { pty: true } }).then((result) => {
        console.log('stdout:' + result.stdout);
        console.log('stderr:' + result.stderr);
        console.log('signal:' + result.signal);
    });
    console.log('All ssh tasks should have been completed.');
    isConnected = true;
}

async function internalInject(command) {
    if (!connection) {
        console.error("Tried to connect ssh server without preparation!");
        return;
    }
    console.log('Injecting command:' + command);
    command.execCommand(command, { options: { pty: true } }).then((result) => {
        console.log('stdout:' + result.stdout);
        console.log('stderr:' + result.stderr);
        console.log('signal:' + result.signal);

        return '```' + result.stdout + '```' + '\n```' + result.stderr + '```' + '\n```' + result.signal + '```';
    });
}