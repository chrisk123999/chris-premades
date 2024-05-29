import {getSetting} from '../../settings.js';
import {dialogUtils} from '../../utilities/dialogUtils.js';
import {effectUtils} from '../../utilities/effectUtils.js';
import {helpers} from '../../utilities/genericUtils.js';
async function use(workflow) {
    if (!workflow.targets.size) return;
    let buttons = Object.entries(CONFIG.DND5E.abilities).map(i => [i.label, i.abbreviation]);
    let selection = await dialogUtils.buttonMenu({title: workflow.item.name, description:'CHRISPREMADES.Hex.SelectAbility', buttons: buttons});
    if (!selection) return;
    let seconds;
    switch (workflow.castData.castLevel) {
        case 3:
        case 4:
            seconds = 28800;
            break;
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
            seconds = 86400;
            break;
        default:
            seconds = 3600;
    }
    let durationScale = workflow.item.system.duration.value;
    seconds = Math.min(seconds * durationScale, 86400);
    let targetEffectData = {
        name: helpers.translate('CHRISPREMADES.Hex.Hexed'),
        icon: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: seconds
        },
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.ability.check.' + selection,
                mode: 0,
                value: true,
                priority: 20
            }
        ]
    };
    let targetEffects = [];
    for (let i of workflow.targets) {
        if (i.actor) {
            let targetEffect = await effectUtils.createEffect(i.actor, targetEffectData, {concentrationItem: workflow.item, identifier: 'hexed'});
            targetEffects.push(targetEffect);
        }
    }
    let casterEffect = {
        name: workflow.item.name,
        icon: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: seconds
        }
    };
    effectUtils.addOnUseMacros(casterEffect, 'actor', ['hex']);
    await effectUtils.createEffect(workflow.actor, casterEffect, {});  //here
    
}
async function damage(workflow) {

}
async function move(workflow) {

}
export let hex = {
    name: 'Hex',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'RollComplete',
                macro: use,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'postDamageRollComplete',
                macro: damage,
                priority: 250
            }
        ]
    }
};
export let hexMove = {
    name: 'Hex - Move',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'RollComplete',
                macro: move,
                priority: 50
            }
        ]
    }
};