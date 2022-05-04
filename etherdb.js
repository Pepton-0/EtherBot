// !EXPERIMENT! THIS DOESN'T WORK!
// https://glitch.com/~low-db
// setup a new database
// persisted using async file storage
// Security note: the database is saved to the file `db.json` on the local filesystem.
// It's deliberately placed in the `.data` directory which doesn't get copied if someone remixes the project.
const { SlashCommandBuilder } = require('@discordjs/builders');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('.data/db.json')
const db = low(adapter)
const defaultJson = { // set this for each guild
    guild_id: 'something',
    prohibit_everyone: false
};
db.defaults({ content: [Object.assign({}, defaultJson)] }).write();

module.exports.resetDatabase = (guildId) => {
    remove(guildId);
    create(guildId);

    console.log(db.get('content').value()[0]);
}

module.exports.debug = (guildId, label) => {
}

module.exports.getDbCommands = () => {
    const builder0 = new SlashCommandBuilder()
        .setName('resetdatabase')
        .setDescription('Reset all the settings and data for this bot. Leaders and bot manager can use this command.');
    const builder1 = new SlashCommandBuilder()
        .setName('setproperty')
        .setDescription('Configure settings for this bot.'); // TODO CONFIGURE
 //setsubcommand

    return [builder0, builder1];
};

function create(guildId) {
    const content = db.get('content');
    if (content.value() == null) {
        const copy = Object.assign({}, defaultJson);
        copy.guild_id = guildId;
        content.push(copy)
            .write();
    }
}

function remove(guildId) {
    const content = db.get('content');
    if (content.value() == null)
        return;
    // TODO TODO
}

/*
app.get("/users", function (request, response) {
    var dbUsers = [];
    var users = db.get('users').value() // Find all users in the collection
    users.forEach(function (user) {
        dbUsers.push([user.firstName, user.lastName]); // adds their info to the dbUsers value
    });
    response.send(dbUsers); // sends dbUsers back to the page
});*/

/*
// creates a new entry in the users collection with the submitted values
app.post("/users", function (request, response) {
    db.get('users')
        .push({ firstName: request.query.fName, lastName: request.query.lName })
        .write()
    console.log("New user inserted in the database");
    response.sendStatus(200);
});*/

/*
// removes entries from users and populates it with default users
app.get("/reset", function (request, response) {
    // removes all entries from the collection
    db.get('users')
        .remove()
        .write()
    console.log("Database cleared");

    // default users inserted in the database
    var users = [
        { "firstName": "John", "lastName": "Hancock" },
        { "firstName": "Liz", "lastName": "Smith" },
        { "firstName": "Ahmed", "lastName": "Khan" }
    ];

    users.forEach(function (user) {
        db.get('users')
            .push({ firstName: user.firstName, lastName: user.lastName })
            .write()
    });
    console.log("Default users added");
    response.redirect("/");
});*/

/*
// removes all entries from the collection
app.get("/clear", function (request, response) {
    // removes all entries from the collection
    db.get('users')
        .remove()
        .write()
    console.log("Database cleared");
    response.redirect("/");
});*/