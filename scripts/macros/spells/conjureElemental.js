import {summons} from '../../utility/summons.js';
import {chris} from '../../helperFunctions.js';
export async function conjureElemental({speaker, actor, token, character, item, args, scope, workflow}) {
    let spellLevel = workflow.castData?.castLevel;
    if (!spellLevel) return;
    let cr = spellLevel;
    let folder = chris.getConfiguration(workflow.item, 'folder') ?? game.settings.get('chris-premades', 'Summons Folder');
    if (!folder && folder === '') folder = 'Chris Premades';
    let actors = game.actors.filter(i => i.folder?.name === folder).filter(i => i.system?.details?.type?.value.toLowerCase() === 'elemental').filter(i => i.system?.details?.cr <= cr);
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
    let animation = chris.getConfiguration(workflow.item, 'animation') ?? 'default';
    if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    await summons.spawn(sourceActors, updates, 3600, workflow.item, workflow.token, workflow.item.system?.range?.value, {'useActorOrigin': true, 'spawnAnimation': animation});
    let effect = chris.findEffect(workflow.actor, 'Concentrating');
    if (!effect) return;
    async function effectMacro () {
        let targetEffect = chrisPremades.helpers.findEffect(effect.parent, 'Conjure Elemental');
        if (!targetEffect) return;
        let summons = targetEffect.flags['chris-premades']?.summons?.ids['Conjure Elemental'];
        if (!summons) return;
        let updates = {
            'token': {
                'disposition': token.document.disposition * -1 
            }
        };
        let options = {
            'permanent': true,
            'name': 'Conjure Elemental - Hostile',
            'description': 'Conjure Elemental - Hostile'
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