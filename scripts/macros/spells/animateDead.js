import {summons} from '../../utility/summons.js';
import {chris} from '../../helperFunctions.js';
export async function animateDead({speaker, actor, token, character, item, args, scope, workflow}) {
    let zombieActor = game.actors.getName('CPR - Zombie');
    let skeletonActor = game.actors.getName('CPR - Skeleton');
    if (!zombieActor || !skeletonActor) {
        ui.notifications.warn('Missing required sidebar actor!');
        return;
    }
    let spellLevel = workflow.castData?.castLevel;
    if (!spellLevel) return;
    let totalSummons = 1 + (spellLevel - 3) * 2;
    if (workflow.actor.flags['chris-premades']?.feature?.undeadThralls) totalSummons += 1;
    if (!totalSummons || totalSummons < 1) return;
    let sourceActors = await chris.selectDocuments('Select Summons (Max ' + totalSummons + ')', [zombieActor, skeletonActor]);
    if (!sourceActors) return;
    if (sourceActors.length > totalSummons) {
        ui.notifications.info('Too many selected, try again!');
        return;
    }
    let updates =  {
        'token': {
            'disposition': 1 
        }
    }
    let animation = chris.getConfiguration(workflow.item, 'animation') ?? ((chris.jb2aCheck() === 'patreon' && chris.aseCheck()) ? 'shadow' : 'none');
    await summons.spawn(sourceActors, updates, 86400, workflow.item, undefined, undefined, 10, workflow.token, animation);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Animate Dead - Command', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Animate Dead - Command');
    let updates2 = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': workflow.item.name,
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options);
    let effect = chris.findEffect(workflow.actor, workflow.item.name);
    if (!effect) return;
    let currentScript = effect.flags.effectmacro?.onDelete?.script;
    if (!currentScript) return;
    let effectUpdates = {
        'flags': {
            'effectmacro': {
                'onDelete': { 
                    'script': currentScript + '; await warpgate.revert(token.document, "' + effect.name + '");'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': featureData.name
                }
            }
        }
    };
    await chris.updateEffect(effect, effectUpdates);
}