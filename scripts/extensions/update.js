import {genericUtils} from '../utils.js';
export async function updateCheck() {
    if (game.messages.contents.find(i => i.flags?.['chris-premades']?.updateCheck)) return;
    let lastCheck = genericUtils.getCPRSetting('lastUpdateCheck');
    let hours = 22 * 60 * 60 * 1000;
    let now = Date.now();
    if (lastCheck + hours > now) return;
    genericUtils.setCPRSetting('lastUpdateCheck', now);
    try {
        let reponse = await fetch('https://api.github.com/repos/chrisk123999/chris-premades/releases/latest');
        if (!reponse.ok) return;
        let info = await reponse.json();
        let currentVersion = game.modules.get('chris-premades').version;
        if (currentVersion === '#{VERSION}#') return;
        if (!genericUtils.isNewerVersion(info.tag_name, currentVersion)) return;
        let body = info.body.replaceAll('\r\n\r\n', '<hr>')
            .replaceAll('\r\n', '<br>')
            .replaceAll('New Content:', '<b><u>New Content:</u></b>')
            .replaceAll('New Monster Content:', '<b><u>New Monster Content:</u></b>')
            .replaceAll('New Generic Monster Features:', '<b><u>New Generic Monster Features:</u></b>')
            .replaceAll('Updated Content:', '<b><u>Updated Content:</u></b>')
            .replaceAll('Bug Fixes:', '<b><u>Bug Fixes:</u></b>')
            .replaceAll('Update Notes:', '<b><u>Update Notes:</u></b>')
            .replaceAll('New Enhanced Animations:', '<b><u>New Enhanced Animations:</u></b>')
            .replaceAll('API Bug Fixes:', '<b><u>API Bug Fixes:</u></b>')
            .replaceAll('API Updates', '<b><u>API Updates:</u></b>')
            .replaceAll('New Modern Rules Content:', '<b><u>New Modern Rules Content</u></b>')
            .replaceAll('New Legacy Rules Content:', '<b><u>New Modern Legacy Content</u></b>');
        let message = '<hr>Cauldron of Plentiful Resources update <b>' + info.tag_name + '</b> available!<hr>' + body;
        await ChatMessage.create({
            speaker: {alias: name},
            content: message,
            whisper: [game.user.id],
            flags: {
                'chris-premades': {
                    updateCheck: true
                }
            }
        });
    } catch (error) {
        console.error(error);
    }
}