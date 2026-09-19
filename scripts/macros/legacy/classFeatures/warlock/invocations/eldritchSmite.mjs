import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, workflowUtils, DamageBonus} from '../../../../../proxy.mjs';
function isPactWeapon(item) {
    return documentUtils.getIdentifier(item) === 'pact-weapon' || !!documentUtils.getEffectByIdentifier(item, 'pactWeapon');
}
async function use({bonus, workflow}) {
    await workflowUtils.completeItemUse(bonus.document, workflow.hitTargets);
    const targetActor = workflow.hitTargets.first().actor;
    if (actorUtils.getSize(targetActor) > 4 || actorUtils.getEffectByStatusID(targetActor, 'prone')) return;
    const selection = await dialogUtils.confirm(bonus.document.name, _loc('CHRISPREMADES.Macros.Legacy.EldritchSmite.Prone'));
    if (!selection) return;
    await actorUtils.applyConditions(targetActor, ['prone']);
}
function damage({document, workflow}) {
    if (workflow.hitTargets.size !== 1 || !workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    if (!isPactWeapon(workflow.item)) return;
    const pact = workflow.actor.system.spells.pact;
    if (!pact?.value) return;
    const damageType = automationUtils.getConfigValue(document, 'damageType');
    return new DamageBonus(document, {formula: (1 + pact.level) + 'd8', type: damageType}).withOnUse(use);
}
export const eldritchSmite = {
    name: 'Eldritch Invocations: Eldritch Smite',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            phase: 'postResult',
            macro: damage,
            priority: 250
        }
    ],
    config: {
        damageType: {
            default: 'force',
            type: 'select',
            label: 'CHRISPREMADES.Config.DamageType',
            category: 'homebrew',
            get options() { return constants.damageTypeOptions(); }
        }
    }
};
