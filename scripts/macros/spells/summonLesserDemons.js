import {summons} from '../../utility/summons.js';
import {chris} from '../../helperFunctions.js';
export async function summonLesserDemons({speaker, actor, token, character, item, args, scope, workflow}){
    let spellLevel = workflow.castData?.castLevel;
    if (!spellLevel) return;
    let summonsMultiplier = spellLevel > 7 ? 3 : spellLevel > 5 ? 2 : 1;
    let roll = await new Roll('1d6').roll({async: true});
    let flavor;
    let cr;
    switch (roll.total) {
        case 1:
        case 2:
            flavor = (summonsMultiplier * 2) + ' demons of challenge rating 1 or lower';
            cr = 1;
            break;
        case 3:
        case 4:
            flavor = (summonsMultiplier * 4) + ' demons of challenge rating 1/2 or lower';
            cr = 0.5;
            break;
        case 5:
        case 6:
            flavor = (summonsMultiplier * 8) + ' demons of challenge rating 1/4 or lower';
            cr = 0.25;
    }
    roll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: flavor
    });
    let folder = chris.getConfiguration(workflow.item, 'folder') ?? game.settings.get('chris-premades', 'Summons Folder');
    if (!folder && folder === '') folder = 'Chris Premades';
    let actors = game.actors.filter(i => i.folder?.name === folder).filter(i => i.system?.details?.type?.subtype.toLowerCase() === 'demon').filter(i => i.system?.details?.cr <= cr);
    if (actors.length < 1) {
        ui.notifications.warn('No matching actors found in specified folder!');
        return;
    }
    let userId = game.settings.get('chris-premades', 'LastGM');
    if (game.settings.get('chris-premades', 'Player Choses Conjures')) userId = game.userId;
    if (!userId) return;
    let sourceActors = await chris.remoteDocumentsDialog(userId, 'Select Summons (Max ' + (summonsMultiplier * 2 / cr) + ')', actors);
    if (!sourceActors) return;
    if (sourceActors.length > (summonsMultiplier * 2 / cr)) {
        ui.notifications.info('Too many selected, try again!');
        return;
    }
    let updates = {
        'token': {
            'disposition': -1 
        }
    };
    await summons.spawn(sourceActors, updates, 3600, workflow.item, false, true);
    let templateData = {
        t: CONST.MEASURED_TEMPLATE_TYPES.CIRCLE,
        distance: 2.5 * workflow.actor.prototypeToken.width,
        x: workflow.token.center.x,
        y: workflow.token.center.y,
        borderColor: '#941010'
    };
    let template = await chris.createTemplate(templateData);
    new Sequence()
        .effect()
            .atLocation(template[0])
            .origin(template[0].uuid)
            .file('jb2a.extras.tmfx.runes.circle.simple.conjuration')
            .scale(0.2 * workflow.actor.prototypeToken.width)
            .tint('#941010')
            .persist(true)
            .belowTokens(true)
            .tieToDocuments(template[0])
        .effect()
            .atLocation(template[0])
            .origin(template[0].uuid)
            .file('jb2a.extras.tmfx.border.circle.simple.01')
            .scale(0.2 * workflow.actor.prototypeToken.width)
            .tint('#941010')
            .persist(true)
            .tieToDocuments(template[0])
        .play();
    let effect = chris.findEffect(workflow.actor, workflow.item.name);
    if (!effect) return;
    let currentScript = effect.flags.effectmacro?.onDelete?.script;
    if (!currentScript) return;
    let newScript = '; let template = await fromUuid(effect.flags[\'chris-premades\']?.spell?.summonLesserDemons); if (!template) return; await template.delete();'
    let effectUpdates = {
        'flags': {
            'effectmacro': {
                'onDelete': { 
                    'script': currentScript + newScript
                }
            },
            'chris-premades': {
                'spell': {
                    'summonLesserDemons': template[0].uuid
                }
            }
        }
    };
    await chris.updateEffect(effect, effectUpdates);
}