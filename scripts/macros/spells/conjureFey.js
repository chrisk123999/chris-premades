import {summons} from '../../utility/summons.js';
import {chris} from '../../helperFunctions.js';
export async function conjureFey({speaker, actor, token, character, item, args, scope, workflow}) {
    let spellLevel = workflow.castData?.castLevel;
    if (!spellLevel) return;
    let cr = spellLevel;
    let folder = chris.getConfiguration(workflow.item, 'folder') ?? game.settings.get('chris-premades', 'Summons Folder');
    if (!folder && folder === '') folder = 'Chris Premades';
    let actors = game.actors.filter(i => i.folder?.name === folder).filter(i => ['fey', 'beast'].includes(i.system?.details?.type?.value.toLowerCase())).filter(i => i.system?.details?.cr <= cr);
    if (actors.length < 1) {
        ui.notifications.warn('No matching actors found in specified folder!');
        return;
    }
    let userId = game.settings.get('chris-premades', 'LastGM');
    if (game.settings.get('chris-premades', 'Player Chooses Conjures')) userId = game.userId;
    if (!userId) return;
    let sourceActors = await chris.remoteDocumentDialog(userId, 'Select Summon', actors, false, true, true);
    if (!sourceActors) return;
    let updates = {
        'token': {
            'disposition': workflow.token.document.disposition
        }
    };
    let animation = chris.getConfiguration(workflow.item, 'animation') ?? 'nature';
    if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    await summons.spawn(sourceActors, updates, 3600, workflow.item, true, undefined, 90, workflow.token, animation, undefined, true);
    let effect = MidiQOL.getConcentrationEffect(workflow.actor, workflow.item);
    if (!effect) return;
    async function effectMacro () {
        let targetEffect = chrisPremades.helpers.findEffect(effect.parent, 'Conjure Fey');
        if (!targetEffect) return;
        let summons = targetEffect.flags['chris-premades']?.summons?.ids['Conjure Fey'];
        if (!summons) return;
        let updates = {
            'token': {
                'disposition': token.document.disposition * -1 
            }
        };
        let options = {
            'permanent': true,
            'name': 'Conjure Fey - Hostile',
            'description': 'Conjure Fey - Hostile'
        };
        for (let i of summons) {
            let token = canvas.scene.tokens.get(i);
            if (token) await warpgate.mutate(token, updates, {}, options);
        }
    }
    let effectUpdates = {
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            }
        }
    };
    await chris.updateEffect(effect, effectUpdates);
}