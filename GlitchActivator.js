var GLITCH_URL = "https://nameishere.glitch.me";

// Repeat this every 5 minutes
function wakeGlitch() {
    var json = {
        'type': 'wake'
    };
    sendGlitch(GLITCH_URL, json);
}
function sendDayChange() {
    var json = {
        'type': 'daychange'
    };
    sendGlitch(GLITCH_URL, json);
}
function sendGlitch(uri, json) {
    var params = {
        'contentType': 'application/json; charset=utf-8',
        'method': 'post',
        'payload': json,
        'muteHttpExceptions': true
    };
    response = UrlFetchApp.fetch(uri, params);
}