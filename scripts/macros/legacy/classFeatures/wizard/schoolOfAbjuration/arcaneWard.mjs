import {automationUtils, constants, dialogUtils, documentUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
export async function arcaneWardHelper({document: item, ditem, projectedWard, token, targetToken}) {
    if (!ditem.isHit) return;
    const temp = ditem.oldTempHP * automationUtils.getConfigValue(item, 'tempFirst');
    const hpDamage = ditem.damageDetail.reduce((acc, i) => acc + (i.properties.has('heal') ? 0 : i.value), 0) - temp;
    if (hpDamage <= 0) return;
    const uses = item.system.uses.value;
    if (!uses) return;
    const absorbed = Math.min(hpDamage, uses);
    const remainingDamage = hpDamage - absorbed;
    if (projectedWard) {
        if (targetToken.disposition !== token.disposition) return;
        if (tokenUtils.getDistance(token, targetToken) > automationUtils.getConfigValue(projectedWard, 'range')) return;
        const selection = await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.Legacy.ArcaneWard.Protect', {tokenName: targetToken.name}), {userId: queryUtils.firstOwner(token.actor, true)});
        if (!selection) return;
        await workflowUtils.completeItemUse(projectedWard);
    }
    await documentUtils.update(item, {'system.uses.spent': item.system.uses.spent + absorbed});
    workflowUtils.setDamageItemDamage(ditem, remainingDamage + temp, false);
}
async function late({document, workflow}) {
    if (workflow.item.type !== 'spell') return;
    if (workflow.item.system.school !== automationUtils.getConfigValue(document, 'school')) return;
    const spellLevel = workflowUtils.getCastLevel(workflow);
    if (!spellLevel) return;
    if (workflowUtils.isSustainedRoll(workflow)) return;
    const sourceClass = itemUtils.getAdvancementSourceItem(document) ?? workflow.actor.classes.wizard;
    if (!sourceClass) return;
    const spellcastingAbility = automationUtils.getConfigValue(document, 'spellcastingAbility');
    const maxUses = sourceClass.system.levels * 2 + workflow.actor.system.abilities[spellcastingAbility].mod;
    let add = spellLevel * 2;
    if (!document.flags['chris-premades']?.arcaneWard?.alreadyUsed) {
        add = maxUses;
        await documentUtils.setFlag(document, 'chris-premades', 'arcaneWard.alreadyUsed', true);
    }
    const uses = document.system.uses.value;
    await documentUtils.update(document, {'system.uses': {spent: Math.clamp(maxUses - (uses + add), 0, maxUses), max: maxUses}});
}
async function longRest({document}) {
    await documentUtils.setFlag(document, 'chris-premades', 'arcaneWard.alreadyUsed', false);
}
export const arcaneWard = {
    name: 'Arcane Ward',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'targetDamageComplete',
            macro: arcaneWardHelper,
            priority: 50
        },
        {
            pass: 'actorRollFinished',
            macro: late,
            priority: 50
        }
    ],
    rest: [
        {
            pass: 'actorLong',
            macro: longRest,
            priority: 50
        }
    ],
    config: {
        tempFirst: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Legacy.ArcaneWard.TempHP',
            category: 'homebrew'
        },
        spellcastingAbility: {
            default: 'int',
            type: 'select',
            get options() { return constants.abilityOptions(); },
            label: 'CHRISPREMADES.Config.Ability',
            category: 'homebrew'
        },
        school: {
            default: 'abj',
            type: 'select',
            get options() { return constants.spellSchoolOptions(); },
            label: 'CHRISPREMADES.Config.SpellSchool',
            category: 'mechanics'
        }
    }
};
