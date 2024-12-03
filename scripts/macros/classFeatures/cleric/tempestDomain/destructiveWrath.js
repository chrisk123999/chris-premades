import {effectUtils, genericUtils} from '../../../../utils.js';

async function use({workflow}) {
    if (effectUtils.getEffectByIdentifier(workflow.actor, 'destructiveWrath')) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        flags: {
            dae: {
                showIcon: true
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['destructiveWrathActive']);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'destructiveWrath'});
}
async function damage({trigger: {entity: effect}, workflow}) {
    if (!workflow.damageRolls.length) return;
    let validTypes = ['lightning', 'thunder'];
    if (!workflow.damageRolls.filter(i => validTypes.includes(i.options.type))) return;
    await Promise.all(workflow.damageRolls.map(async (damageRoll, i, arr) => {
        if (validTypes.includes(damageRoll.options.type)) arr[i] = await damageRoll.reroll({maximize: true});
    }));
    await workflow.setDamageRolls(workflow.damageRolls);
    await genericUtils.remove(effect);
}
export let destructiveWrath = {
    name: 'Channel Divinity: Destructive Wrath',
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
export let destructiveWrathActive = {
    name: 'Channel Divinity: Destructive Wrath - Active',
    version: destructiveWrath.version,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};