import {effectUtils, genericUtils, itemUtils} from '../../../utils.js';

async function use({workflow}) {
    let actor = workflow.targets.first()?.actor ?? workflow.actor;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.actor.uuid,
        duration: itemUtils.convertDuration(workflow.item)
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['potionOfMaximumPower']);
    await effectUtils.createEffect(actor, effectData);
}
async function damage({trigger: {entity: effect}, workflow}) {
    for (let damageRoll of workflow.damageRolls) {
        for (let term of damageRoll.terms) {
            for (let i = 0; i < term.values.length; i++) {
                term.results[i].result = term.faces;
            }
        }
    }
    await workflow.setDamageRolls(workflow.damageRolls);
    await genericUtils.remove(effect);
}
export let potionOfMaximumPower = {
    name: 'Potion of Maximum Power',
    version: '0.12.70',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};