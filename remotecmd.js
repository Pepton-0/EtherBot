const { NodeSSH } = require('node-ssh');
const { connected, stderr } = require('process');
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
    if (!isConnected) {
        console.error("Tried to connect ssh server without preparation!");
        return "Tried to connect ssh server without preparation!";
    }
    console.log('Injecting command:' + command);
    let result = await connection.execCommand(command, { options: { pty: true } });
    let str = '```' + (result.stdout ?? 'none') + '```';
    if (result.stderr && stderr.length >= 1)
        str += '```' + stderr + '```';
    if (result.signal && signal.length >= 1)
        str += '```' + signal + '```';
    console.log(str);
    return str;
}