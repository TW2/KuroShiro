const Discord = require('discord.js');
const bot = new Discord.Client();
var Nightmare = require('Nightmare');
require('nightmare-download-manager')(Nightmare);

const PREFIX = '!';

//==============================================================================================
// FUNCTIONS
//==============================================================================================

function listFiles(url, msg){
    var http = require('http');

    var options = {
        host: getHost(url),
        path: getPath(url)
    }
    var request = http.request(options, function (res) {
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            var list = getDownloadable(data.toString());
            for(var i=0; i<list.length; i++){
                msg.author.send('Pack #' + list[i][0] + ' <> ' + list[i][1]);
            }
            msg.author.send('End of list, type for example (on Windows): !get 21 "C:\\Users\\<user>\\Videos" to download the file #21 at your personal Videos folder!');
        });
    });
    request.on('error', function (e) {
        console.log(e.message);
    });
    request.end();
}

function downloadFile(url, index, ospath, msg){
    var http = require('http');

    var options = {
        host: getHost(url),
        path: getPath(url)
    }
    var request = http.request(options, function (res) {
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            var list = getDownloadable(data.toString());
            launchDownload(url, list, index, ospath, msg);
        });
    });
    request.on('error', function (e) {
        console.log(e.message);
    });
    request.end();
}

function getHost(url){
    var result = url.match(/[^:]+.{3}([^/]+)/);
    return result[1];
}

function getPath(url){
    var result = url.match(/[^:]+.{3}[^/]+(.*)/);
    return result[1].endsWith('/') ? result[1] : result[1] + "/";
}

function getDownloadable(webpage){
    var current_index = 0;
    var last_index = webpage.lastIndexOf('a href=');
    var count = 0;
    var biglist = [];

    while(current_index < last_index){
        current_index = webpage.indexOf('a href=', current_index + 1);
        var limit = webpage.indexOf('>', current_index);
        var link = webpage.substring(current_index + 'a href="'.length, limit - 1);
        var filename = link.substring(link.lastIndexOf('/') + 1);

        biglist.push([++count, filename, link]);
    }

    return biglist;
}

function launchDownload(url, listFiles, index, ospath, msg){    
    if(ospath.includes('\\\\') === false){
        ospath = ospath.replace('\\', '\\\\');
    }
    if(ospath.endsWith('\\\\') === false){
        ospath = ospath + "\\\\";
    }
    var msgtosend = -1;
    var filetosend = "";
    var threshold = [0, 20, 40, 60, 80, 100];
    var limit = 0;

    var nightmare = Nightmare();
    nightmare.on('download', function(state, downloadItem){
        if(state == 'started'){
            filetosend = Object.values(downloadItem)[0];
            nightmare.emit('download', ospath + filetosend, downloadItem);
            msg.author.send('Started download for ' + filetosend);
        }else if(state == 'updated'){
            var receiveBytes = Object.values(downloadItem)[2];
            var totalBytes = Object.values(downloadItem)[3];
            var percent = receiveBytes * 100 / totalBytes;

            if(limit < threshold.length && percent >= threshold[limit]){
                // Calculation of a readable percent   
                var result = percent.toFixed(2) + "%";
                if(result.length == 5) { result = "00" + result; }
                if(result.length == 6) { result = "0" + result; }

                if(msgtosend != result){
                    msg.author.send(result);
                    msgtosend = result;
                }

                limit++;
            }              
        }else if(state == 'completed'){
            msg.author.send('Download finished for ' + filetosend);
            msgtosend = -1;
        }
    });
    
    nightmare
    .downloadManager()
    .goto(url)
    .click('a[href="' + listFiles[index][2] + '"]')
    .waitDownloadsComplete()
    .then(() => {
        console.log('done');
    });
}

//==============================================================================================
// ACTIONS
//==============================================================================================

bot.on('ready', () => {
  console.log(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', msg => {
    if(msg.content[0] === PREFIX) {
        if(msg.content === '!list') {
            msg.author.send(`Welcome, ${msg.author.tag}!`);
            msg.author.send('Notice: "your_pc_path" is the wanted folder in your Operating System (Android, Linux, Mac, Windows) for downloaded files!');
            listFiles(<your page url here>, msg);            
        }

        if(msg.content.match(/!get/)) {
            var result = msg.content.match(/!get\s+(\d+)\s+"([^"]+)"/);
            downloadFile(<your page url here>, result[1] - 1, result[2], msg);
        }
    }
});

bot.login(<your token here>);


