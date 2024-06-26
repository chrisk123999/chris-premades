import {dialogUtils, effectUtils, genericUtils} from '../../utils.js';

async function use({workflow}) {
    let input = {
        label: 'DND5E.Skill',
        name: 'skillSelected',
        options: {
            options: Object.entries(CONFIG.DND5E.skills).filter(([key, _]) => workflow.actor.system.skills[key].value < 1).map(([value, {label}]) => {return {value, label};})
        }
    };
    let selection = await dialogUtils.selectDialog(workflow.item.name, 'CHRISPREMADES.macros.borrowedKnowledge.selectSkill', input);
    if (!selection) return;
    let effectData = {
        name: workflow.item.name,
        icon: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 3600 * workflow.item.system.duration.value
        },
        changes: [
            {
                key: 'system.skills.' + selection + '.value',
                mode: 4,
                value: 1,
                priority: 20
            }
        ]
    };
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'borrowedKnowledge');
    if (effect) await genericUtils.remove(effect);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'borrowedKnowledge'});
}

export let borrowedKnowledge = {
    name: 'Borrowed Knowledge',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'RollComplete',
                macro: use,
                priority: 50
            }
        ]
    }
};