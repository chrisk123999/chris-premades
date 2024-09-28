import {actorUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';

async function late({workflow}) {
    if (!workflow.failedSaves.size) return;
    if (!workflow.item.effects.size) {
        genericUtils.notify(genericUtils.format('CHRISPREMADES.Generic.NoEffect', {itemName: workflow.item.name}), 'info');
        return;
    }
    for (let target of workflow.failedSaves) {
        let effect = Array.from(target.actor.allApplicableEffects()).find(i => i.origin === workflow.item.uuid);
        if (!effect) continue;
        let currentCombatFlags = effect.flags['chris-premades']?.macros?.combat ?? [];
        await genericUtils.update(effect, {
            'flags.chris-premades.macros.combat': currentCombatFlags.concat('damageTurnStartTarget')
        });
    }
}
async function turnStart({trigger: {entity: effect, token}}) {
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let config = itemUtils.getGenericFeatureConfig(originItem, 'damageTurnStart');
    let damageRoll = config.specificDamage.length ? config.specificDamage : originItem.system.damage.parts.map(i => i[0]).join(' + ');
    let roll = await new Roll(damageRoll, originItem.getRollData()).evaluate();
    await workflowUtils.applyWorkflowDamage(actorUtils.getFirstToken(originItem.actor), roll, null, [token], {flavor: originItem.name});
}
export let damageTurnStart = {
    name: 'Damage on Turn Start',
    translation: 'CHRISPREMADES.Macros.DamageTurnStart.Name',
    version: '0.12.78',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'specificDamage',
            label: 'CHRISPREMADES.Macros.DamageTurnStart.SpecificDamage',
            type: 'text',
            default: ''
        }
    ]
};
export let damageTurnStartTarget = {
    name: 'Damage on Turn Start: Target',
    version: damageTurnStart.version,
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};