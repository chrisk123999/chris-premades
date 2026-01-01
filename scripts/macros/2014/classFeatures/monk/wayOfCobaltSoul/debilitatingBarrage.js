import {actorUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function attack({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size || !itemUtils.canUse(item)) return;
    let isUnarmed = constants.unarmedAttacks.includes(genericUtils.getIdentifier(workflow.item));
    if (!isUnarmed) return;
    let selection = await dialogUtils.confirmUseItem(item);
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(item, [workflow.hitTargets.first()], {consumeResources: true, consumeUsage: true});
}
async function use({trigger, workflow}) {
    let damageType = await dialogUtils.selectDamageType(Object.keys(CONFIG.DND5E.damageTypes), workflow.item.name, 'CHRISPREMADES.Generic.SelectDamageType');
    if (!damageType) return;
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    if (actorUtils.checkTrait(workflow.targets.first().actor, 'di', damageType)) return;
    if (actorUtils.checkTrait(workflow.targets.first(), 'dr', damageType)) {
        effectData.changes[0].key = 'system.traits.dr.value';
        effectData.changes[0].value = '-' + damageType;
    } else {
        effectData.changes[0].value = damageType;
    }
    genericUtils.setProperty(effectData, 'flags.chris-premades.debilitatingBarrage.damageType', damageType);
    await effectUtils.createEffect(workflow.targets.first().actor, effectData);
}
async function hit({trigger: {entity: effect}, workflow}) {
    if (!workflow.hitTargets.size || !workflow.damageRolls || effect.flags.dae?.specialDuration?.includes('turnEnd')) return;
    let damageType = effect.flags['chris-premades']?.debilitatingBarrage?.damageType;
    if (!damageType) return;
    let damageTypes = workflowUtils.getDamageTypes(workflow.damageRolls);
    if (!damageTypes.has(damageType)) return;
    await genericUtils.setFlag(effect, 'dae', 'specialDuration', 'turnEnd');
}
export let debilitatingBarrage = {
    name: 'Debilitating Barrage',
    version: '1.4.8',
    rules: 'legacy'
};