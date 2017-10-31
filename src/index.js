const request = require('request');
const fs = require('fs');

const fetch = function (options, callback) {
    return new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            callback && callback(error, response, body);
            if (error) {
                return reject(error);
            }
            resolve({response, body});
        });
    });
}

async function fetchUUID() {
    console.log('fetchUUID', '>>>>>>>>>>>>>>>');
    const uri = '/jslogin';
    const param = {
        appid: 'wx782c26e4c19acffb',
        fun: 'new',
        redirect_uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxnewloginpage',
        lang: 'en_US',
        _: Date.now()
    };
    const options = {
        uri: uri,
        baseUrl: 'https://login.weixin.qq.com',
        method: 'GET',
        qs: param
    };
    const {response, body} = await fetch(options);
    const uuid = /window.QRLogin.code = (\d+); window.QRLogin.uuid = "([^"]+)";/.exec(body)[2];
    return uuid;
};

async function fetchQrcode(uuid) {
    console.log('fetchQrcode', '>>>>>>>>>>>>>>>');
    const uri = `/qrcode/${uuid}`;
    const options = {
        uri: uri,
        baseUrl: 'https://login.weixin.qq.com',
        method: 'GET',
        agentOptions: {
            keepAlive: true
        }
    };
    request(options).pipe(fs.createWriteStream('qicode.png'));;
};

async function checkScan({tip, uuid}) {
    console.log('checkScan', '>>>>>>>>>>>>>>>');
    const timestamp = ~Date.now();
    const uri = `/cgi-bin/mmwebwx-bin/login?loginicon=true&tip=${tip}&uuid=${uuid}&r=${timestamp}`;
    const options = {
        uri: uri,
        baseUrl: 'https://login.weixin.qq.com',
        method: 'GET',
        agentOptions: {
            keepAlive: true
        }
    };
    const {response, body} = await fetch(options);
    // console.log(body);
    const code = /window\.code=(\d+)/.exec(body)[1];
    if (code === '408') {
        console.log('登陆超时');
        return checkScan({tip: 1, uuid});
    } else if (code === '201') {
        console.log('扫描成功');
        return checkScan({tip: 0, uuid});
    } else if (code === '200') {
        console.log('确认登录');
        return body;
    }
};

async function login(redirectUri) {
    console.log('login', '>>>>>>>>>>>>>>>');

    const jar = request.jar();
    const url = /window\.redirect_uri="([^"]+)"/.exec(redirectUri)[1];
    const {response, body} = await fetch({
        url,
        jar,
        followRedirect: false,
        agentOptions: {
            keepAlive: true
        },
        headers: {
            'Host': 'wx.qq.com'
        }
    });
    const {skey, sid, uin, deviceid, passTicket} = getBaseRequest(body);
    return {
        jar,
        skey,
        sid,
        uin,
        deviceid,
        passTicket
    };
    return {data: body, jar};
}

function getBaseRequest(body) {
    console.log('getBaseRequest', '>>>>>>>>>>>>>>>');

    const skeyReg = new RegExp('<skey>([^<]+)</skey>');
    const sidReg = new RegExp('<wxsid>([^<]+)</wxsid>');
    const uinReg = new RegExp('<wxuin>([^<]+)</wxuin>');
    const passTicketReg = new RegExp('<pass_ticket>([^<]+)</pass_ticket>');
    // dirty hack
    const passTicket = passTicketReg.exec(body)[1];

    const baseRequest = {
        skey: skeyReg.exec(body)[1],
        sid: sidReg.exec(body)[1],
        uin: uinReg.exec(body)[1],
        deviceid: 'e' + ('' + Math.random().toFixed(15)).substring(2, 17)
    };
    return {
        skey: skeyReg.exec(body)[1],
        sid: sidReg.exec(body)[1],
        uin: uinReg.exec(body)[1],
        deviceid: 'e' + ('' + Math.random().toFixed(15)).substring(2, 17),
        passTicket
    };
    return {baseRequest, passTicket};
}

async function init({
    uuid,
    jar,
    skey,
    sid,
    uin,
    deviceid,
    passTicket
}) {
    console.log('init', '>>>>>>>>>>>>>>>');

    const uri = `/cgi-bin/mmwebwx-bin/webwxinit?lang=en_US&pass_ticket=${passTicket}`;
    const options = {
        uri,
        baseUrl: 'https://wx.qq.com',
        method: 'POST',
        body: {
            BaseRequest: {
                Uin: uin,
                Sid: sid,
                Skey: skey,
                DeviceID: deviceid
            }
        },
        json: true,
        agentOptions: {
            keepAlive: true
        },
        headers: {
            'Accept': '*/*',
            'Connection': 'keep-alive',
            'Host': 'wx.qq.com'
        },
        jar
    };

    const {response, body} = await fetch(options);
    return {user: body.User, syncKey: body.SyncKey};
}

async function fetchContacts({
    uuid,
    jar,
    skey,
    sid,
    uin,
    deviceid,
    passTicket
}) {
    console.log('fetchContact', '>>>>>>>>>>>>>>>');

    const timestamp = Date.now();

    const uri = `/cgi-bin/mmwebwx-bin/webwxgetcontact?lang=zh_CN&pass_ticket=${passTicket}&r=${timestamp}&seq=0&skey=${skey}`;

    const options = {
        uri,
        baseUrl: 'https://wx.qq.com',
        method: 'GET',
        json: true,
        agentOptions: {
            keepAlive: true
        },
        headers: {
            'Host': 'wx.qq.com'
        },
        jar
    };

    const {response, body} = await fetch(options);
    return body;
}

async function sendMessage(msg, userName, {
    uuid,
    jar,
    skey,
    sid,
    uin,
    deviceid,
    passTicket,
    user
}) {
    console.log('sendMessage', '>>>>>>>>>>>>>>>');
    var msgId = (Date.now() + Math.random().toFixed(3)).replace('.', '');

    const options = {
        baseUrl: 'https://wx.qq.com',
        uri: `/cgi-bin/mmwebwx-bin/webwxsendmsg?lang=en_US&pass_ticket=${passTicket}`,
        method: 'POST',
        jar: jar,
        json: true,
        body: {
            BaseRequest: {
                Uin: uin,
                Sid: sid,
                Skey: skey,
                DeviceID: deviceid
            },
            Msg: {
                "Type": 1,
                "Content": msg,
                "FromUserName": user.UserName,
                "ToUserName": userName,
                "LocalID": msgId,
                "ClientMsgId": msgId
            }
        }
    };

    const {response, body} = await fetch(options);
    return body;
}

async function syncheck(session, callback) {
    console.log('syncheck', '>>>>>>>>>>>>>>>');
    const {
        uuid,
        jar,
        skey,
        sid,
        uin,
        deviceid,
        passTicket,
        syncKey
    } = session;
    const timestamp = Date.now();
    // const deviceid = 'e' + ('' + Math.random().toFixed(15)).substring(2, 17)
    // console.log(passTicket, skey, sid, uin, deviceid, syncKey);
    const synckey = syncKey
            .List
            .map(o => o.Key + '_' + o.Val)
            .join('|')
    const uri = `/cgi-bin/mmwebwx-bin/synccheck?r=${timestamp}&skey=${skey}&sid=${sid}&uin=${uin}&deviceid=${deviceid}&synckey=${synckey}`
    const options = {
        baseUrl: 'https://webpush.wx.qq.com',
        uri,
        method: 'GET',
        agentOptions: {
            keepAlive: true
        },
        forever: true,
        headers: {
            'Host': 'webpush.wx.qq.com',
            'Referer': 'https://wx.qq.com/',
            'Connection': 'keep-alive'
        },
        jar,
        timeout: 35e3, // 源码这么写的
    };
    
    const {response, body} = await fetch(options);
    if (body == 'window.synccheck={retcode:"1101",selector:"0"}') {
        console.log("服务器断开连接，退出程序")
        return false;
    } else if (body !== 'window.synccheck={retcode:"0",selector:"0"}') {
        const data = await sync(session);
        session.syncKey = data.SyncKey;
        callback && callback(data, session);
        await syncheck(session, callback);
    } else {
        await syncheck(session, callback);
        //await webwxsync(session);
    }
}

async function sync({
    uuid,
    jar,
    skey,
    sid,
    uin,
    deviceid,
    passTicket,
    syncKey
}) {
    console.log('webwxsync', '>>>>>>>>>>>>>>>'); 
    const timestamp = ~Date.now();
    const uri = `/cgi-bin/mmwebwx-bin/webwxsync?sid=${sid}&skey=${skey}]&pass_ticket=${passTicket}`;
    const options = {
        baseUrl: 'https://wx.qq.com',
        uri,
        method: 'POST',
        body: {
            BaseRequest: {
                Skey: skey,
                Sid: sid,
                Uin: uin,
                DeviceID: deviceid
            },
            SyncKey: syncKey,
            rr: timestamp
        },
        json: true,
        headers: {
            'Host': 'wx.qq.com'
        },
        jar,
        timeout: 15e3, // 不设定又会hang
    };
    const {response, body} = await fetch(options);
    // 更新 synckey
    return body;
}

async function server(handleMessage) {

    const uuid = await fetchUUID();

    await fetchQrcode(uuid);
    const redirectUri = await checkScan({tip: 1, uuid});

    const {
        jar,
        skey,
        sid,
        uin,
        deviceid,
        passTicket
    } = await login(redirectUri);

    // const {baseRequest, passTicket} = getBaseRequest(data);
    var session = {
        uuid,
        jar,
        skey,
        sid,
        uin,
        deviceid,
        passTicket
    };

    const {user, syncKey} = await init(session);

    session.user = user;
    session.syncKey = syncKey;

    const contacts = await fetchContacts(session);

    session.contacts = contacts;

    // await sendMessage('此消息是机器人测试，不必回复', to, session);
    // console.log(BaseRequest, SyncKey);

    await syncheck(session, handleMessage);
    return {
        contacts
    };
}

module.exports = {
    server,
    sendMessage
};