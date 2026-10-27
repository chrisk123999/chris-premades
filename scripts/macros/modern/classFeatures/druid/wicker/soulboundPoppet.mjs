import cprConstants from '../../../../../constants.mjs';
import utils from '../../../../../utils.mjs';
import {automationUtils, combatUtils, compendiumUtils, constants, DamageBonus, documentUtils, effectUtils, genericUtils, itemUtils, Logging, tokenUtils} from '../../../../../proxy.mjs';
function getPoppetData(item) {
    return item.flags['chris-premades']?.soulboundPoppet ?? {};
}
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'soulbound-poppet') return;
    const targetToken = workflow.targets.first();
    if (!targetToken?.actor) return;
    const effect = documentUtils.getEffectByIdentifier(document, 'soulboundPoppet');
    if (!effect) return Logging.addMacroWarning('CPR', 'soulbound-poppet', 'Soulbound Poppet effect missing from item.', {notify: 'warn'});
    const [casterEffect] = await effectUtils.createEffects(workflow.actor, [documentUtils.getEffectData(workflow.activity, effect.id, {activityUuid: workflow.activity.uuid})]) ?? [];
    if (!casterEffect) return;
    const itemData = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.misc.automationItems, 'soulbound-poppet-doll', {object: true});
    if (!itemData) return Logging.addMacroWarning('CPR', 'soulbound-poppet', 'Soulbound Poppet doll missing from the automation items compendium.', {notify: 'warn'});
    itemData.name = _loc('CHRISPREMADES.Macros.Modern.SoulboundPoppet.Doll', {name: targetToken.name});
    genericUtils.setProperty(itemData, 'flags.chris-premades.soulboundPoppet', {
        target: targetToken.actor.uuid,
        effect: casterEffect.uuid,
        formula: automationUtils.getConfigValue(document, 'formula'),
        damageType: automationUtils.getConfigValue(document, 'damageType')
    });
    await utils.createCharms(workflow.actor, [itemData], {key: 'soulboundPoppet', source: workflow.actor, favorite: true});
}
async function expired({document: effect}) {
    await itemUtils.deleteWorldItemsByFlag('chris-premades', 'soulboundPoppet.effect', effect.uuid);
}
function attacked({document: item, workflow}) {
    if (workflow.actor?.uuid !== getPoppetData(item).target) return;
    workflow.tracker.disadvantage.add('soulbound-poppet', item.name);
}
function damage({document: item, workflow}) {
    const poppetData = getPoppetData(item);
    if (!poppetData.target || !workflow.damageRolls?.length) return;
    const pool = workflow.activity?.hasAttack ? workflow.hitTargets : workflow.targets;
    const targets = Array.from(pool, token => token.document ?? token).filter(token => token.actor?.uuid === poppetData.target);
    if (!targets.length) return;
    const combatData = tokenUtils.getCombatData(targets[0]);
    const stamps = poppetData.stamps ?? [];
    if (combatUtils.isStampedThisTurn(stamps, targets[0].id, combatData)) return;
    const bonus = new DamageBonus(item, {formula: poppetData.formula, optional: false, type: poppetData.damageType})
        .withOnUse(async () => {
            if (combatData.inCombat) await documentUtils.setFlag(item, 'chris-premades', 'soulboundPoppet.stamps', combatUtils.addTurnStamp(stamps, targets[0].id, combatData));
        });
    bonus.targets = targets;
    return bonus;
}
export const soulboundPoppet = {
    name: 'Soulbound Poppet',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    effect: [
        {
            pass: 'deleted',
            macro: expired,
            priority: 50
        }
    ],
    config: {
        formula: {
            default: '2d10',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        },
        damageType: {
            default: 'necrotic',
            type: 'select',
            label: 'CHRISPREMADES.Config.DamageType',
            category: 'homebrew',
            get options() { return constants.damageTypeOptions; }
        }
    }
};
export const soulboundPoppetDoll = {
    name: 'Soulbound Poppet: Doll',
    version: soulboundPoppet.version,
    rules: soulboundPoppet.rules,
    roll: [
        {
            pass: 'targetAttackRollConfig',
            macro: attacked,
            priority: 50
        },
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 250
        }
    ]
};
