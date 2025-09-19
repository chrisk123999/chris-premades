import {combatUtils, constants, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';

async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1 || !workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    let rageEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'rage');
    if (!rageEffect) return;
    let damageType = genericUtils.getIdentifier(item) === 'divineFuryNecrotic' ? 'necrotic' : 'radiant';
    let barbDamage = Math.floor((workflow.actor.classes.barbarian?.system.levels ?? 0) / 2);
    if (!combatUtils.perTurnCheck(item, 'divineFury', true, workflow.token.id)) return;
    await combatUtils.setTurnCheck(item, 'divineFury');
    let bonusDamageFormula = '1d6 + ' + barbDamage;
    await workflowUtils.bonusDamage(workflow, bonusDamageFormula, {damageType});
}
async function combatEnd({trigger: {entity: item}}) {
    await combatUtils.setTurnCheck(item, 'divineFury', true);
}
export let divineFuryNecrotic = {
    name: 'Divine Fury: Necrotic',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'combatEnd',
            macro: combatEnd,
            priority: 50
        }
    ]
};
export let divineFuryRadiant = {
    name: 'Divine Fury: Radiant',
    version: divineFuryNecrotic.version,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'combatEnd',
            macro: combatEnd,
            priority: 50
        }
    ]
};