import {actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';

export async function arcaneWardHelper(item, ditem, token, targetToken) {
    let hpDamage = ditem.damageDetail.reduce((acc, i) => acc + i.value, 0) - ditem.oldTempHP;
    if (hpDamage <= 0) return;
    let uses = item.system.uses.value;
    if (!uses) return;
    let absorbed = Math.min(hpDamage, uses);
    let remainingDamage = hpDamage - absorbed;
    if (token) {
        let projectedWard = itemUtils.getItemByIdentifier(token.actor, 'projectedWard');
        if (!projectedWard) return;
        if (targetToken.document.disposition !== token.document.disposition) return;
        if (tokenUtils.getDistance(token, targetToken) > genericUtils.handleMetric(30)) return;
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.ArcaneWard.Protect', {tokenName: targetToken.name}), {userId: socketUtils.firstOwner(token.actor, true)});
        if (!selection) return;
        await workflowUtils.completeItemUse(projectedWard);
    }
    await genericUtils.update(item, {'system.uses.spent': item.system.uses.spent + absorbed});
    workflowUtils.setDamageItemDamage(ditem, remainingDamage + ditem.oldTempHP, false);
}
async function damageApplication({trigger: {entity: item}, ditem}) {
    await arcaneWardHelper(item, ditem);
}
async function late({trigger: {entity: item}, workflow}) {
    if (workflow.item.type !== 'spell') return;
    if (workflow.item.system.school !== 'abj') return;
    let spellLevel = workflowUtils.getCastLevel(workflow);
    if (!spellLevel) return;
    let maxUses = workflow.actor.classes.wizard?.system.levels * 2 + workflow.actor.system.abilities.int.mod;
    let add = spellLevel * 2;
    if (!item.flags['chris-premades']?.arcaneWard?.alreadyUsed) {
        add = maxUses;
        await genericUtils.setFlag(item, 'chris-premades', 'arcaneWard.alreadyUsed', true);
    }
    let uses = item.system.uses.value;
    await genericUtils.update(item, {'system.uses': {spent: Math.clamp(maxUses - (uses + add), 0, maxUses), max: maxUses}});
}
async function longRest({trigger: {entity: item}}) {
    await genericUtils.setFlag(item, 'chris-premades', 'arcaneWard.alreadyUsed', false);
}
export let arcaneWard = {
    name: 'Arcane Ward',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: damageApplication,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    rest: [
        {
            pass: 'long',
            macro: longRest,
            priority: 50
        }
    ],
    ddbi: {
        removedItems: {
            'Arcane Ward': [
                'Arcane Ward - Hit Points'
            ]
        },
        correctedItems: {
            'Arcane Ward': {
                system: {
                    uses: {
                        max: 1,
                        per: 'charges',
                        recovery: '',
                        value: 0
                    }
                }
            }
        }
    }
};