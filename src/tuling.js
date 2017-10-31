const http = require('http');
const net = require('net');
const url = require('url');
const xml2js = require('xml2js');
const querystring = require('querystring');

const options = {
    hostname: 'www.tuling123.com',
    path: '/openapi/api',
    port: 80,
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
};

function chat(content, callback) {
    let body = querystring.stringify({
        'key': 'ed18a28894f9411cb0c96dd9a3c98363',
        'info': content,
        'userid': 'f075d517-b4bb-47be-b63a-5248a515bbe4',
        'loc': '上海'
    });


    const req = http.request(options, (res) => {
        // console.log(res.statusCode);
        // console.log(JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            const data = JSON.parse(chunk);
            console.log(data, data.code, data.code == 100000);
            if (data.code == 100000) {
                callback(data.text);
            }
        });
    });
    console.log(encodeURIComponent(JSON.stringify(body)));
    req.write(body);
    req.end();
}

module.exports = {
    chat: chat
}