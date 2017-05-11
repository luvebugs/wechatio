const tuling = require('./tuling');
const xiaobing = require('./xiaobing');

const {Wechaty} = require('wechaty');

const bot = Wechaty.instance();

bot.on('scan', (url, code) => console.log(`Scan QR Code to login: ${code}\n${url}`)).on('login', user => console.log(`User ${user.name()} logined`));
bot.on('message', message => {
    const msg = message.content();
    const from = message.from();
    const formRoom = message.room();
    const fromSelf = message.self();
    const type = message.type();
    console.log(`Message: ${msg}`);
    if (fromSelf) {
        return;
    }
    if (formRoom) {
        return;
    } else {
        // console.log(from, type);
        // if (from.obj.weixin !== 'xiaoice-ms') {
        //     message.say(content);
        // } else {
            switch (type) {
            case 1:
                tuling.chat(msg, function (content) {
                    message.say(content);
                });
                break;
            default:
                xiaobing.chat(message, msg);
                break;
            }
        // }
        
    }
}).init();
