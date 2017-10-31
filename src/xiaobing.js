function chat (message, content) {
    const from = message.from();
    message.from('@3a8595eb2c70915d0965a49e90ec3feceac1b48e481064c21faf8879ce3e533f');
    message.say(content);
    message.from(from);
}

module.exports = {
    chat: chat
}