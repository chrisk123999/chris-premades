import {actorUtils, documentUtils, effectUtils} from '../../../../../proxy.mjs';
async function late({document: item, workflow}) {
    if (workflow.item.type !== 'spell') return;
    if (actorUtils.getEffectByIdentifier(workflow.actor, 'durableMagic')) return;
    const concEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!concEffect) return;
    const effectData = documentUtils.getBaseEffectData(item, {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        identifier: 'durableMagic',
        changes: [
            {
                key: 'system.attributes.ac.bonus',
                type: 'add',
                value: 2,
                priority: 20
            },
            {
                key: 'system.bonuses.abilities.save',
                type: 'add',
                value: 2,
                priority: 20
            }
        ]
    });
    const effects = await effectUtils.createEffects(workflow.actor, [effectData]);
    if (effects?.length) await documentUtils.makeDependent(concEffect, effects);
}
export const durableMagic = {
    name: 'Durable Magic',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: late,
            priority: 50
        }
    ]
};
