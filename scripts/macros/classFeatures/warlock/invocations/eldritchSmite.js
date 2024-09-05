import {actorUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function damage({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    let isSummonedPactWeapon = genericUtils.getIdentifier(workflow.item) === 'pactWeapon';
    let isEnchantedPactWeapon = Array.from(workflow.item.allApplicableEffects()).find(i => genericUtils.getIdentifier(i) === 'pactWeapon');
    if (!isSummonedPactWeapon && !isEnchantedPactWeapon) return;
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'eldritchSmite');
    if (!feature) return;
    let pactInfo = workflow.actor.system.spells.pact;
    if (pactInfo.value === 0) return;
    let selection = await dialogUtils.confirm(feature.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: feature.name}));
    if (!selection) return;
    await genericUtils.update(workflow.actor, {'system.spells.pact.value': pactInfo.value - 1});
    let damageType = itemUtils.getConfig(feature, 'damageType') ?? 'force';
    let bonusFormula = (1 + pactInfo.level) + 'd8[' + damageType + ']';
    await workflowUtils.bonusDamage(workflow, bonusFormula, {damageType});
    await feature.displayCard();
    let targetActor = workflow.targets.first().actor;
    if (actorUtils.getSize(targetActor) > 4 || effectUtils.getEffectByStatusID(targetActor, 'prone')) return;
    let selection2 = await dialogUtils.confirm(feature.name, 'CHRISPREMADES.Macros.EldritchSmite.Prone');
    if (!selection2) return;
    await effectUtils.applyConditions(targetActor, ['prone']);
}
export let eldritchSmite = {
    name: 'Eldritch Invocations: Eldritch Smite',
    version: '0.12.54',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'force',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};