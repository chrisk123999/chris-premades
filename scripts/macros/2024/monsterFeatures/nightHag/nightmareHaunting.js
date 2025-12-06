import {effectUtils, genericUtils} from '../../../../utils.js';
async function use({trigger: {entity: item}, workflow}) {
    if (!workflow.failedSaves.size || !workflow.damageRolls) return;
    let uuid = workflow.item.flags.dnd5e?.cachedFor;
    if (!uuid) return;
    let activity = await fromUuid(uuid, {relative: workflow.actor});
    if (activity.item.uuid != item.uuid) return;
    await Promise.all(workflow.targets.map(async token => {
        if (!workflow.failedSaves.has(token)) return;
        let ditem = workflow.damageList.find(i => i.actorId === token.actor.id);
        if (!ditem) return;
        let damageApplied = ditem.damageDetail.reduce((acc, i) => acc + i.value, 0);
        damageApplied = Math.floor(damageApplied);
        if (!damageApplied) return;
        let totalMax = token.actor.system.attributes.hp.max;
        let effect = effectUtils.getEffectByIdentifier(token.actor, 'nightmareHauntingEffect');
        if (effect) {
            let currReduction = parseInt(effect.changes[0].value);
            await genericUtils.update(effect, {
                changes: [
                    {
                        key: 'system.attributes.hp.tempmax',
                        mode: 2,
                        value: Math.max(-totalMax, currReduction - damageApplied),
                        priority: 20
                    }
                ]
            });
        } else {
            let effectData = {
                name: item.name,
                img: item.img,
                origin: item.uuid,
                changes: [
                    {
                        key: 'system.attributes.hp.tempmax',
                        mode: 2,
                        value: -damageApplied,
                        priority: 20
                    }
                ],
                flags: {
                    dae: {
                        showIcon: true
                    }
                }
            };
            await effectUtils.createEffect(token.actor, effectData, {identifier: 'nightmareHauntingEffect'});
        }
        if (Math.abs(token.actor.system.attributes.hp.tempmax) >= totalMax) {
            effectUtils.applyConditions(token.actor, ['dead'], {overlay: true});
        }
    }));
}
export let nightmareHaunting = {
    name: 'Nightmare Haunting',
    version: '1.3.160',
    rules: 'modern',
    aliases: ['Nightmare Haunting (1/Day; Requires Soul Bag)'],
    monsters: [
        'Night Hag'
    ],
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};