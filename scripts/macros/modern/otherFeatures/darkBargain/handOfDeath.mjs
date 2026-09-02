import {actorUtils, dialogUtils, documentUtils, genericUtils, queryUtils, workflowUtils} from '../../../../proxy.mjs';
async function heal({ditem, workflow, targetToken}) {
    if (ditem.oldHP != 0 || ditem.newHP <= ditem.oldHP || workflow.token.document.id === targetToken.id) return;
    workflowUtils.negateDamageItemDamage(ditem);
    workflowUtils.setWorkflowProperty(workflow, 'deathKnell', true);
}
async function complete({document, workflow, token}) {
    const deathKnell = workflowUtils.getWorkflowProperty(workflow, 'deathKnell');
    if (!deathKnell) return;
    await workflowUtils.completeActivityUse(document, [token]);
}
async function turnStart({document, token, actor}) {
    if (!document.item.system.uses.value) return;
    if (actor.system.attributes.hp.value !== 0) return;
    const selection = await dialogUtils.confirmUseItem(document);
    if (!selection) return;
    await documentUtils.update(actor, {'system.attributes.hp.value': Math.floor(actor.system.attributes.hp.max / 2)});
    await workflowUtils.completeActivityUse(document, [token]);
}
async function damage({document, ditem, actor, targetToken}) {
    if (!document.item.system.uses.value) return;
    const maxHP = actor.system.attributes.hp.max;
    const hpDamage = ditem.oldHP + ditem.oldTempHP - ditem.totalDamage;
    if (!ditem.isHit || ditem.newHP !== 0 || hpDamage > -maxHP) return;
    const selection = await dialogUtils.confirmUseItem(document, {userId: queryUtils.firstOwner(document.actor, true)});
    if (!selection) return;
    const targetHP = Math.floor(maxHP / 2);
    await workflowUtils.preventZeroHP(ditem, {targetHP, deathOnly: true, actor});
    await workflowUtils.completeActivityUse(document, [targetToken]);
}
async function dead({document, token, actor, effect}) {
    if (!effect.statuses.includes('dead') || !document.item.system.uses.value) return;
    const selection = await dialogUtils.confirmUseItem(document);
    if (!selection) return;
    await documentUtils.update(actor, {'system.attributes.hp.value': Math.floor(actor.system.attributes.hp.max / 2)});
    await workflowUtils.completeActivityUse(document, [token]);
    return true;
}
async function updated({document, updates, actor}) {
    if (updates.system?.uses?.spent === undefined) return;
    const effect = actorUtils.getEffectByIdentifier(actor, 'clingToLifeEffect');
    if (!effect) return;
    if (document.system.uses.value > 0) {
        if (effect.disabled) return;
        await documentUtils.update(effect, {disabled: true});
    } else {
        if (!effect.disabled) return;
        await documentUtils.update(effect, {disabled: false});
    }
}
async function nearbyDied({document, effect, token, actor}) {
    if (document.item.system.uses.value || !effect.statuses.includes('dead')) return;
    const species = actorUtils.typeOrRace(actor);
    if (species !== 'humanoid') return;
    const sourceToken = actorUtils.getFirstToken(document.actor);
    await workflowUtils.completeActivityUse(document, [sourceToken], {consumeUsage: false, consumeResources: false});
    await documentUtils.update(document.item, {'system.uses.spent': document.item.system.uses.spent - 1});
}
export const handOfDeath = {
    name: 'Hand of Death',
    version: '2.0.3',
    rules: '2024',
    item: [
        {
            pass: 'updated',
            macro: updated,
            priority: 50
        }
    ]
};
export const handOfDeathDeathKnell = {
    name: 'Hand of Death: Death Knell',
    version: handOfDeath.version,
    rules: handOfDeath.rules,
    roll: [
        {
            pass: 'actorRollFinished',
            macro: complete,
            priority: 200
        },
        {
            pass: 'actorDamageComplete',
            macro: heal,
            priority: 200
        }
    ]
};
export const handOfDeathClingToLife = {
    name: 'Hand of Death: Cling to Life',
    version: handOfDeath.version,
    rules: handOfDeath.rules,
    combat: [
        {
            pass: 'actorTurnStart',
            macro: turnStart,
            priority: 5
        }
    ],
    effect: [
        {
            pass: 'actorDoCreated',
            macro: dead,
            priority: 5
        },
        {
            pass: 'nearbyDoCreated',
            macro: nearbyDied,
            priority: 50,
            distance: 30
        }
    ],
    roll: [
        {
            pass: 'targetDamageComplete',
            macro: damage,
            priority: 150
        }
    ]
};