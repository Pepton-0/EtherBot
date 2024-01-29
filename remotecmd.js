const { NodeSSH } = require('node-ssh');
const { connected, stderr } = require('process');
const connection = new NodeSSH();
// let isConnected = false;
let connectData;

// connect to yamato's server
module.exports.connect = async(host, username, privateKey) => internalConnect(host, username, privateKey);

module.exports.inject = async(command) => internalInject(command);

async function internalConnect(host, username, privateKey) {
    if (connected)
        conenction.dispose();
    console.log('Start connecting to yamato\'s server...');
    connectData = {
        host: host,
        username: username,
        privateKey: privateKey
    };
    await connection.connect(connectData);
    await connection.execCommand('ls', { options: { pty: true } }).then((result) => {
        console.log('stdout:' + result.stdout);
        console.log('stderr:' + result.stderr);
        console.log('signal:' + result.signal);
    });
    connection.dispose();
    console.log('All ssh tasks should have been completed.');
    // isConnected = true;
}

async function internalInject(command) {
    console.log("Start injecting " + command);
    await connection.connect(connectData);
    connection.execCommand(command, { options: { pty: true } }).then((result)=>connection.dispose());
    connection.dispose();
    /** 
    if (!isConnected) {
        console.error("Tried to connect ssh server without preparation!");
        return "Tried to connect ssh server without preparation!";
    }
    console.log('Injecting command:' + command);
    let result = await connection.execCommand(command, { options: { pty: true } });
    let str = '';
    if (result.stdout && result.stdout.length >= 1)
        str += '```' + result.stdout + '```';
    if (result.stderr && result.stderr.length >= 1)
        str += '```' + result.stderr + '```';
    if (result.signal && result.signal.length >= 1)
        str += '```' + result.signal + '```';
    console.log(str);
    return str;**/
}