export async function checkUpdate() {
    try {
        let reponse = await fetch('https://api.github.com/repos/chrisk123999/chris-premades/releases/latest');
        if (!reponse.ok) return;
        let info = await reponse.json();
        let currentVersion = game.modules.get('chris-premades').version;
        if (currentVersion === '#{VERSION}#') return;
        if (!isNewerVersion(info.tag_name, currentVersion)) return;
        let body = info.body.replaceAll('\r\n\r\n', '<hr>')
            .replaceAll('\r\n', '<br>')
            .replaceAll('New Content:', '<b><u>New Content:</u></b>')
            .replaceAll('New Monster Content:', '<b><u>New Monster Content:</u></b>')
            .replaceAll('Bug Fixes:', '<b><u>Bug Fixes:</u></b>')
            .replaceAll('Update Notes:', '<b><u>Update Notes:</u></b>');
        let message = '<hr>Chris\'s Premades update <b>' + info.tag_name + '</b> available!<hr>' + body;
        await ChatMessage.create({
            speaker: {'alias': name},
            content: message
        });
    } catch {};
}