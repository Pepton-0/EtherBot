var SIGNALING_URL = "urlhere";
var ETHERBOT_URL = "urlhere";
function wakeSignaling() {
    var json = {
        'type': 'wake'
    };
    sendSignaling(SIGNALING_URL, json);
    sendSignaling(ETHERBOT_URL, json);
}
function sendSignaling(uri, json) {
    var params = {
        'contentType': 'application/json; charset=utf-8',
        'method': 'post',
        'payload': json,
        'muteHttpExceptions': true
    };
    response = UrlFetchApp.fetch(uri, params);
}