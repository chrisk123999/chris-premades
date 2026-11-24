import {cpr} from '../../../../module.mjs';
import {activityUtils, actorUtils, compendiumUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
import {isWearingArcaneArmor} from './arcaneArmor.mjs';
function getModel(activity) {
    return activity.flags['chris-premades']?.armorModel;
}
function abort(workflow, message) {
    genericUtils.notify(message, {type: 'warn'});
    workflow.aborted = true;
    return true;
}
function hasModel(actor) {
    return actorUtils.getEffects(actor).some(effect => effect.flags['chris-premades']?.armorModel);
}
async function gate({workflow}) {
    if (getModel(workflow.activity) && !isWearingArcaneArmor(workflow.actor)) return abort(workflow, 'CHRISPREMADES.Macros.All.ArmorModel.NotWearing');
    if (getModel(workflow.activity)?.weapon && hasModel(workflow.actor) && !workflow.actor.flags['chris-premades']?.armorModelRested) return abort(workflow, 'CHRISPREMADES.Macros.All.ArmorModel.NotRested');
    if (workflow.activity.identifier === 'defensive-field' && documentUtils.getRules(workflow.item) === '2024' && !actorUtils.isBloodied(workflow.actor)) return abort(workflow, 'CHRISPREMADES.Macros.All.ArmorModel.NotBloodied');
}
async function defensiveField({workflow}) {
    const temp = workflow.actor.system.attributes.hp.temp ?? 0;
    await effectUtils.createEffects(workflow.actor, [{
        name: workflow.activity.name,
        img: workflow.activity.img || workflow.item.img,
        origin: workflow.activity.uuid,
        flags: {dae: {stackable: 'noneNameOnly'}, cat: {identifier: 'defensiveField', specialDuration: ['tempHP']}, 'chris-premades': {defensiveField: temp}}
    }]);
}
async function flight({workflow}) {
    const effect = actorUtils.getEffects(workflow.actor).find(effect => effectUtils.getOriginActivitySync(effect)?.uuid === workflow.activity.uuid);
    if (!effect) return;
    const speed = String(2 * (workflow.actor.system.attributes.movement.walk ?? 0));
    await documentUtils.update(effect, {'system.changes': effect.system.changes.map(change => ({...change, value: speed}))});
}
async function use({document: item, workflow}) {
    if (workflow.activity.identifier === 'defensive-field') return await defensiveField({workflow});
    if (workflow.activity.identifier === 'perfected-fly') return await flight({workflow});
    const data = getModel(workflow.activity);
    if (!data?.weapon) return;
    const actor = workflow.actor;
    await documentUtils.setFlag(actor, 'chris-premades', 'armorModelRested', false);
    const modelEffects = actorUtils.getEffects(actor).filter(effect => effect.flags['chris-premades']?.armorModel);
    const current = modelEffects.filter(effect => effectUtils.getOriginActivitySync(effect)?.uuid === workflow.activity.uuid).at(-1);
    await Promise.all(modelEffects.filter(effect => effect !== current).map(effect => documentUtils.deleteDocument(effect)));
    if (!current) return;
    const weapon = await compendiumUtils.getDocumentByIdentifier(cpr.packs.misc.automationItems, data.weapon, {object: true});
    if (!weapon) return Logging.addMacroWarning('chris-premades', 'armor-model', 'Armor model weapon missing from pack.', {notify: 'warn'});
    weapon.system.equipped = true;
    if (actorUtils.getItemByIdentifier(actor, 'improved-armorer')) weapon.system.magicalBonus = 1;
    if (data.perfected && actorUtils.getItemByIdentifier(actor, 'perfected-armor')) genericUtils.mergeObject(weapon.system.damage.base, data.perfected);
    await itemUtils.createItems(actor, [weapon], {favorite: true, parentEntity: current});
    const owners = actor.items.filter(other => other.system.activities?.some(activity => getModel(activity)?.model));
    for (const owner of owners) {
        const activities = owner.system.activities.filter(activity => getModel(activity)?.model && !getModel(activity).weapon && !activity.flags.cat?.macros?.roll?.some(macro => macro.identifier === 'attackRider'));
        const shown = activities.filter(activity => getModel(activity).model === data.model).map(activity => activity.identifier);
        const hidden = activities.filter(activity => getModel(activity).model !== data.model).map(activity => activity.identifier);
        if (hidden.length) await itemUtils.rehideActivities(owner, hidden);
        if (shown.length) await itemUtils.unhideActivities(owner, shown, {favorite: true});
    }
}
async function refreshWeapon({actor, item: changed}) {
    if (!['improved-armorer', 'perfected-armor'].includes(documentUtils.getIdentifier(changed))) return;
    const current = actorUtils.getEffects(actor).find(effect => effect.flags['chris-premades']?.armorModel);
    const data = current ? getModel(effectUtils.getOriginActivitySync(current) ?? {flags: {}}) : undefined;
    const weapon = data?.weapon ? actorUtils.getItemByIdentifier(actor, data.weapon) : undefined;
    if (!weapon) return;
    const source = await compendiumUtils.getDocumentByIdentifier(cpr.packs.misc.automationItems, data.weapon, {object: true});
    if (!source) return;
    const perfected = data.perfected && actorUtils.getItemByIdentifier(actor, 'perfected-armor') ? data.perfected : {};
    await documentUtils.update(weapon, {
        'system.magicalBonus': actorUtils.getItemByIdentifier(actor, 'improved-armorer') ? '1' : '',
        'system.damage.base.number': perfected.number ?? source.system.damage.base.number,
        'system.damage.base.denomination': perfected.denomination ?? source.system.damage.base.denomination
    });
}
async function rested({actor}) {
    await documentUtils.setFlag(actor, 'chris-premades', 'armorModelRested', true);
}
async function pull({document: item, token}) {
    const activity = item.system.activities.find(activity => activity.identifier === 'perfected-pull');
    if (!activity?.canUse) return;
    if (!token?.actor || !activityUtils.checkCosts(activity)) return;
    const model = actorUtils.getEffects(item.actor).find(effect => effect.flags['chris-premades']?.armorModel?.model === 'guardian');
    if (!model || !isWearingArcaneArmor(item.actor) || actorUtils.hasUsedReaction(item.actor) || item.actor.statuses.has('incapacitated')) return;
    const source = actorUtils.getFirstToken(item.actor);
    if (!source || token.actor === item.actor || !tokenUtils.isEnemy(source, token)) return;
    if (actorUtils.getSize(token.actor) > CONFIG.DND5E.actorSizes.huge.numerical) return;
    if (!tokenUtils.isWithinDistance(source, token, activity.range.value) || !tokenUtils.canSee(source, token)) return;
    const userId = queryUtils.firstOwner(item.actor, true);
    if (!await dialogUtils.confirmUseItem(item, {userId})) return;
    const saveWorkflow = await workflowUtils.completeActivityUse(activity, [token]);
    await actorUtils.setReactionUsed(item.actor);
    if (!saveWorkflow?.failedSaves.count || !tokenUtils.isWithinDistance(source, token, 5)) return;
    const weapons = item.actor.items.filter(weapon => weapon.type === 'weapon' && weapon.system.equipped && ['simpleM', 'martialM', 'natural'].includes(weapon.system.type?.value));
    if (!weapons.length) return;
    const weapon = await dialogUtils.selectDocumentDialog(item.name, 'CHRISPREMADES.Macros.All.ArmorModel.PullAttack', weapons, {addNoneDocument: true, userId});
    const attack = weapon?.system.activities?.find(activity => activity.type === 'attack');
    if (attack) await workflowUtils.completeActivityUse(attack, [token]);
}
export const armorModel = {
    name: 'Armor Model',
    version: '2.1.11',
    rules: 'all',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: gate,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    item: [
        {
            pass: 'actorCreated',
            macro: refreshWeapon,
            priority: 50
        },
        {
            pass: 'actorDeleted',
            macro: refreshWeapon,
            priority: 50
        }
    ],
    rest: [
        {
            pass: 'actorShort',
            macro: rested,
            priority: 50
        },
        {
            pass: 'actorLong',
            macro: rested,
            priority: 50
        }
    ]
};
export const perfectedArmor = {
    name: 'Perfected Armor',
    version: armorModel.version,
    rules: 'all',
    combat: [
        {
            pass: 'sceneTurnEnd',
            macro: pull,
            priority: 50
        }
    ]
};
