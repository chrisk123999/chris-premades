import {dialogUtils, effectUtils, genericUtils, itemUtils} from '../../utils.js';
async function use({workflow}) {
    let input = {
        label: 'DND5E.Skill',
        name: 'skillSelected',
        options: {
            options: Object.entries(CONFIG.DND5E.skills).filter(([key, _]) => workflow.actor.system.skills[key].value < 1).map(([value, {label}]) => {return {value, label};})
        }
    };
    let selection = await dialogUtils.selectDialog(workflow.item.name, 'CHRISPREMADES.Macros.BorrowedKnowledge.SelectSkill', input);
    if (!selection) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
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
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};