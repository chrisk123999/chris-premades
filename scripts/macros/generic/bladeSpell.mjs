import {actorUtils, automationUtils, dialogUtils, rollUtils, workflowUtils, genericUtils, activityUtils, effectUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    if (workflow.targets.size !== 1) return;
    const weapons = actorUtils.getEquippedWeapons(workflow.actor);
    if (!weapons.length) return;
    const selectedWeapon = weapons.length === 1 ? weapons[0] : await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.Generic.BladeSpell.Weapon', weapons);
    if (!selectedWeapon) return;
    const itemData = selectedWeapon.toObject();
    genericUtils.setProperty(itemData, 'flags.chris-premades.bladeSpell', true);
    const ability = automationUtils.getGenericConfigValue(document, 'chris-premades', 'bladeSpell', 'ability');
    const damageTypes = automationUtils.getGenericConfigValue(document, 'chris-premades', 'bladeSpell', 'damageTypes');
    const bonusDamageDieFormula = automationUtils.getGenericConfigValue(document, 'chris-premades', 'bladeSpell', 'bonusDamageDieFormula');
    const diceNumber = bonusDamageDieFormula ? (await rollUtils.rollDice(bonusDamageDieFormula, {document})) : 0;
    const bonusDamageTypes = automationUtils.getGenericConfigValue(document, 'chris-premades', 'bladeSpell', 'bonusDamageTypes');
    const bonusDamageDieDenomination = automationUtils.getGenericConfigValue(document, 'chris-premades', 'bladeSpell', 'bonusDamageDieDenomination');
    let damageType;
    if (damageTypes.length === 1) {
        damageType = damageTypes[0];
    } else if (damageTypes.length) {
        damageType = await dialogUtils.selectDamageType(damageTypes, document.name, 'CHRISPREMADES.Macros.Generic.BladeSpell.ReplaceDamage', {addNo: true});
    }
    if (damageType) itemData.system.damage.base.types = [damageType];
    selectedWeapon.system.activities.getByType('attack').forEach(activity => {
        if (ability !== 'default') {
            if (ability === 'spellcasting' && document.system.ability) {
                itemData.system.activities[activity.id].attack.ability = document.system.ability;
            } else {
                itemData.system.activities[activity.id].attack.ability = ability;
            }
        }
        if (damageType) itemData.system.activities[activity.id].damage.parts.forEach(part => part.types = [damageType]);
        if (diceNumber && bonusDamageDieDenomination) itemData.system.activities[activity.id].damage.parts.push({
            number: diceNumber,
            denomination: bonusDamageDieDenomination,
            types: bonusDamageTypes
        });
    });
    const attackWorkflow = await workflowUtils.syntheticItemDataRoll(itemData, workflow.actor, Array.from(workflow.targets));
    const onHitEffect = automationUtils.getGenericConfigValue(document, 'chris-premades', 'bladeSpell', 'onHitEffect');
    if (onHitEffect && attackWorkflow.hitTargets.size) {
        const sourceEffect = workflow.item.effects.find(effect => effect.id === onHitEffect);
        if (sourceEffect) {
            const sourceEffectData = sourceEffect.toObject();
            sourceEffectData.origin = sourceEffect.uuid;
            sourceEffectData.duration = activityUtils.getEffectDuration(workflow.activity);
            await effectUtils.createEffects(attackWorkflow.hitTargets.first().actor, [sourceEffectData]);
        }
    }
}