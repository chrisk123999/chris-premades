import {actorUtils, automationUtils, DamageBonus, dialogUtils, documentUtils, itemUtils, Logging, queryUtils, tokenUtils, uiUtils, workflowUtils} from '../../../../../proxy.mjs';
async function attackRiders({document: item, macroClass: {identifier, source}, workflow}) {
    const target = workflow.hitTargets.first()?.actor;
    if (!target) return;
    if (!item.system.uses.value) return;
    if (!automationUtils.getConfigValue(item, 'identifiers').includes(documentUtils.getIdentifier(workflow.item))) return;
    const reaction = actorUtils.hasUsedReaction(target);
    const damageActivity = itemUtils.getActivityByIdentifier(item, 'if-damage');
    if (reaction) item.name = `${item._source.name}: ${damageActivity.name}`;
    const bonus = new DamageBonus(item, {targets: workflow.targets.map(t => t.document)})
        .withDefaultCosts({activity: damageActivity})
        .withOnUse(use);
    if (!reaction) bonus.withInputs(await buildInputs(Array.from(item.system.activities)));
    else Logging.addMacroWarning(source, identifier, `Infectious Fury: Reaction Attack was not offered on a target whose reaction was spent. ${workflow.actor.uuid}, (target) ${target.uuid}`);
    return bonus;
}
async function buildInputs(activities) {
    return [['combobox', [{
        label: 'CHRISPREMADES.Macros.Legacy.InfectiousFury.Curses',
        name: 'activity',
        options: {
            tooltip: await uiUtils.enrichHTML(activities[0].item.system.description.value, activities[0].getRollData()),
            value: activities[0].id,
            options: activities.map(a => ({
                tag: a.labels.damage.length ? 
                    a.labels.damage[0].label : 
                    undefined,
                label: a.name,
                image: a.img,
                value: a.id
            }))
        }
    }]]];
}
async function use({bonus}) {
    const activity = bonus.document.system.activities.get(bonus.inputs?.activity);
    await workflowUtils.syntheticActivityRoll(activity ?? bonus.activity, bonus.targets);
}
async function reactionAttack({macroClass: {identifier, source}, workflow}) {
    const cursedAttacker = workflow.failedSaves.first()?.document;
    if (!cursedAttacker?.actor) return;
    const weapons = cursedAttacker.actor.itemTypes.weapon.filter(w => w.system.attackType === 'melee');
    if (!weapons.length) return Logging.addMacroWarning(source, identifier, 'CHRISPREMADES.Macros.Legacy.DedicatedWeapon.NoValid', {notify: true});
    let weapon = weapons[0];
    const userId = queryUtils.firstOwner(cursedAttacker.actor, true);
    if (weapons.length > 1) {
        weapon = await dialogUtils.selectDocumentDialog(
            workflow.item.name,
            _loc('CHRISPREMADES.Macros.Legacy.InfectiousFury.WeaponPrompt', {name: cursedAttacker.name, feature: workflow.item.name}),
            weapons,
            {displayTooltips: true, addNoneDocument: true, userId}
        );
        if (!weapon) return Logging.addMacroWarning(source, identifier, `Infectious Fury: Reaction Attack exited early due to a declined weapon choice prompt. (target) ${cursedAttacker.uuid} (user) ${userId}`);
    }
    const near = tokenUtils.findNearby(cursedAttacker, weapon.system.range.reach, {disposition: 'ally'}).filter(t => tokenUtils.canSee(workflow.token.document, t));
    if (!near.length) return Logging.addMacroWarning(source, identifier, 'CHRISPREMADES.Macros.Modern.HuntersMark.NoTargets', {notify: true});
    let target = near[0];
    if (near.length > 1) {
        target = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectTarget', near, {skipDeadAndUnconscious: false});
        if (!target?.result) return Logging.addMacroWarning(source, identifier, `Infectious Fury: Reaction Attack exited early due to a declined target prompt. (actor) ${workflow.actor.uuid}`);
        target = target.result;
    }
    const data = weapon.toObject();
    for (const activity of Object.values(data.system.activities)) {
        if (activity.type !== 'attack') continue;
        data.system.activities[activity._id].activation.type = 'reaction';
    }
    await workflowUtils.syntheticItemDataRoll(data, cursedAttacker.actor, [target], {userId});
}
export const infectiousFury = {
    name: 'Infectious Fury',
    version: '2.1.4',
    rules: '2014',
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: attackRiders,
            priority: 200
        }
    ],
    config: {
        identifiers: {
            default: [    
                'form-of-the-beast-bite',
                'form-of-the-beast-claws',
                'form-of-the-beast-tail'
            ],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Identifiers',
            hint: 'CHRISPREMADES.Macros.Generic.Common.IdentifierHint'
        }
    }
};
export const infectiousFuryAttack = {
    version: infectiousFury.version,
    rules: infectiousFury.rules,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: reactionAttack,
            priority: 50
        }
    ]
};
