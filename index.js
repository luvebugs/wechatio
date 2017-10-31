const wechat = require('./src/index');
const tuling = require('./src/tuling');

function handleMessage(body, session) {
    const {AddMsgList} = body;
    for (var index = 0; index < AddMsgList.length; index++) {
        const msg = AddMsgList[index];
        console.log(msg);
        const username = msg.FromUserName;
        if (!username.startsWith('@@')) {
            msg.Content && tuling.chat(msg.Content, function (content) {
                wechat.sendMessage(content, msg.FromUserName, session);
            });
        }
    }
}

wechat.server(handleMessage).then(data => {
    const memberList = data.MemberList;
    const to = memberList.filter(item => item.NickName == '依然')[0];
    console.log(to);
});