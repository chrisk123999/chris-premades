import {automationUtils, combatUtils, constants, dialogUtils, documentUtils, effectUtils, genericUtils, rollUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function use({document, workflow}) {
    const concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const cancel = async () => {
        if (concentrationEffect) await documentUtils.deleteDocument(concentrationEffect);
    };
    if (!workflow.targets.size) return await cancel();
    const damageTypes = automationUtils.getConfigValue(document, 'damageTypes');
    const damageType = await dialogUtils.selectDamageType(damageTypes, document.name, 'CHRISPREMADES.Generic.SelectDamageType');
    if (!damageType) return await cancel();
    const sourceEffect = documentUtils.getEffectByIdentifier(document, 'resistanceEffect');
    if (!sourceEffect) return;
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {parentEntity: concentrationEffect});
    effectData.name = `${effectData.name}: ${CONFIG.DND5E.damageTypes[damageType]?.label ?? damageType}`;
    genericUtils.setProperty(effectData, 'flags.chris-premades.resistance', {
        damageType,
        formula: automationUtils.getConfigValue(document, 'formula')
    });
    await Promise.all(Array.from(workflow.targets, target => effectUtils.createEffects(target.actor, [effectData])));
}
async function reduce({document, ditem, targetToken, workflow}) {
    if (!ditem.isHit || ditem.totalDamage <= 0 || !workflow.damageRolls?.length) return;
    const resistanceData = document.flags['chris-premades']?.resistance;
    if (!resistanceData?.damageType || !resistanceData.formula) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has(resistanceData.damageType)) return;
    const combatData = tokenUtils.getCombatData(targetToken);
    const stamps = resistanceData.stamps ?? [];
    if (combatUtils.isStampedThisTurn(stamps, targetToken.id, combatData)) return;
    const roll = await rollUtils.rollDice(resistanceData.formula, {document: targetToken.actor});
    await roll.toMessage({
        speaker: ChatMessage.implementation.getSpeaker({token: targetToken}),
        flavor: document.name
    });
    workflowUtils.modifyDamageAppliedFlat(ditem, -roll.total, {type: resistanceData.damageType});
    if (combatData.inCombat) await documentUtils.setFlag(document, 'chris-premades', 'resistance.stamps', combatUtils.addTurnStamp(stamps, targetToken.id, combatData));
}
export const resistance = {
    name: 'Resistance',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        formula: {
            default: '1d4',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        },
        damageTypes: {
            default: ['acid', 'bludgeoning', 'cold', 'fire', 'lightning', 'necrotic', 'piercing', 'poison', 'radiant', 'slashing', 'thunder'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.DamageTypes',
            category: 'homebrew',
            get options() { return constants.damageTypeOptions; }
        }
    }
};
export const resistanceEffect = {
    name: 'Resistance: Effect',
    version: resistance.version,
    rules: resistance.rules,
    roll: [
        {
            pass: 'targetDamageFlatReductions',
            macro: reduce,
            priority: 50
        }
    ]
};
