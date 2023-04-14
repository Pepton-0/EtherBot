const nodeSsh = require('node-ssh');
const connection = new nodeSsh();

// connect to yamato's server
module.exports.connect = async (host, username, privateKey) => {
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
    connection.dispose();
    console.log('All ssh tasks should have been completed.');
}