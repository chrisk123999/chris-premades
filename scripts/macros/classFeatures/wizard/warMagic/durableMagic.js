import {effectUtils} from '../../../../utils.js';

async function late({trigger: {entity: item}, workflow}) {
    if (workflow.item.type !== 'spell') return;
    if (effectUtils.getEffectByIdentifier(workflow.actor, 'durableMagic')) return;
    let concEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!concEffect) return;
    let effectData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        changes: [
            {
                key: 'system.attributes.ac.bonus',
                mode: 2,
                value: 2,
                priority: 20
            },
            {
                key: 'system.bonuses.abilities.save',
                mode: 2,
                value: 2,
                priority: 20
            }
        ]
    };
    await effectUtils.createEffect(workflow.actor, effectData, {parentEntity: concEffect, identifier: 'durableMagic'});
}
export let durableMagic = {
    name: 'Durable Magic',
    version: '0.12.62',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};