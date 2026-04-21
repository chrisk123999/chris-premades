import {activityUtils, combatUtils, effectUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function cast({workflow}) {
    let target = workflow.targets.first()?.actor;
    if (!target) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        changes: [
            {
                key: 'system.attributes.death.roll.mode',
                value: 1,
                mode: 2,
                priority: 20
            }
        ]
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['deathArmorEffect']);
    await effectUtils.createEffect(target, effectData, {identifier: 'deathArmorEffect', rules: 'modern'});
}
async function hit({trigger: {entity: effect}, workflow}) {
    console.log('HIT', {
        hit:workflow.hitTargets.size,
        type: workflowUtils.isAttackType(workflow, 'meleeAttack'),
        turn: combatUtils.perTurnCheck(effect, 'deathArmor'),
        dist: tokenUtils.getDistance(workflow.token, workflow.targets.first())
    });
    if (!workflow.hitTargets.size) return;
    if (!workflowUtils.isAttackType(workflow, 'meleeAttack')) return;
    if (!combatUtils.perTurnCheck(effect, 'deathArmor')) return;
    if (tokenUtils.getDistance(workflow.token, workflow.targets.first()) > 5) return;
    let spell = await effectUtils.getOriginItem(effect);
    let damage = activityUtils.getActivityByIdentifier(spell, 'damage', {strict: true});
    if (!damage) return;
    await workflowUtils.syntheticActivityRoll(damage, [workflow.token]);
    await combatUtils.setTurnCheck(effect, 'deathArmor');
}
export let deathArmor = {
    name: 'Death Armor',
    version: '1.5.22',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: cast,
                priority: 50,
                activities: ['cast']
            }
        ]
    }
};
export let deathArmorEffect = {
    ...deathArmor,
    midi: {
        actor: [
            {
                pass: 'onHit',
                macro: hit,
                priority: 250
            }
        ]
    }
};
