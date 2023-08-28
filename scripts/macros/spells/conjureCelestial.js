import {summons} from '../../utility/summons.js';
import {chris} from '../../helperFunctions.js';
export async function conjureCelestial({speaker, actor, token, character, item, args, scope, workflow}) {
    let spellLevel = workflow.castData?.castLevel;
    if (!spellLevel) return;
    let cr = 4;
    if (spellLevel === 9) cr = 5;
    let folder = chris.getConfiguration(workflow.item, 'folder') ?? 'Chris Premades';
    let actors = game.actors.filter(i => i.folder?.name === folder).filter(i => i.system?.details?.type?.value.toLowerCase() === 'beast').filter(i => i.system?.details?.cr <= cr);
    if (!actors) {
        ui.notifications.warn('No matching actors found in specified folder!');
        return;
    }
    let userId = game.settings.get('chris-premades', 'LastGM');
    if (game.settings.get('chris-premades', 'Player Choses Conjures')) userId = game.userId;
    if (!userId) return;
    let sourceActors = await chris.remoteDocumentDialog(userId, 'Select Summon', actors);
    if (!sourceActors) return;
    let updates = {
        'token': {
            'disposition': 1 
        }
    };
    await summons.spawn(sourceActors, updates, 3600, workflow.item);
}