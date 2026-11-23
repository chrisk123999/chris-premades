import {activityUtils, actorUtils, combatUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
import {hemocraftModifier} from './crimsonRite.mjs';
async function chooseCurse(item, userId) {
    const curse = itemUtils.getActivityByIdentifier(item, 'curse');
    const amplify = itemUtils.getActivityByIdentifier(item, 'amplify');
    if (!amplify) return curse;
    const selection = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Legacy.BloodCurses.Amplify', [['CHRISPREMADES.Macros.Legacy.BloodCurses.Normal', 'curse'], ['CHRISPREMADES.Macros.Legacy.BloodCurses.Amplified', 'amplify'], ['CHRISPREMADES.Config.None', false]], {userId});
    return selection ? itemUtils.getActivityByIdentifier(item, selection) : undefined;
}
async function fallenPuppet({document: item, workflow}) {
    const owner = item.actor;
    const ownerToken = actorUtils.getFirstToken(owner);
    if (!ownerToken || actorUtils.hasUsedReaction(owner) || !activityUtils.checkCosts(itemUtils.getActivityByIdentifier(item, 'curse'))) return;
    const dropped = (workflow.damageList ?? []).filter(entry => entry.oldHP > 0 && entry.newHP === 0).map(entry => fromUuidSync(entry.tokenUuid ?? entry.targetUuid)).filter(token => token?.actor && token.actor !== owner && tokenUtils.isWithinDistance(ownerToken, token, 30) && tokenUtils.canSee(ownerToken, token));
    if (!dropped.length) return;
    const userId = queryUtils.firstOwner(owner, true);
    const choice = await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.Legacy.BloodCurses.FallenPuppet', dropped, {skipDeadAndUnconscious: false, userId});
    const puppet = choice?.result;
    if (!puppet) return;
    const activity = await chooseCurse(item, userId);
    if (!activity) return;
    await workflowUtils.completeActivityUse(activity, [puppet]);
    await actorUtils.setReactionUsed(owner);
    const amplified = activity.identifier === 'amplify';
    if (amplified) {
        const speed = Math.floor((puppet.actor.system.attributes.movement.speeds.walk ?? 0) / 2);
        if (speed) await tokenUtils.displaceToken(puppet, {sourceToken: puppet, range: speed, action: 'walk'});
    }
    const weapons = puppet.actor.items.filter(weapon => weapon.type === 'weapon' && weapon.system.equipped && weapon.system.activities.some(entry => entry.type === 'attack'));
    if (!weapons.length) return;
    const weapon = weapons.length === 1 ? weapons[0] : await dialogUtils.selectDocumentDialog(item.name, 'CHRISPREMADES.Macros.Legacy.BloodCurses.SelectWeapon', weapons, {userId});
    if (!weapon) return;
    const range = weapon.system.range.long || weapon.system.range.value || weapon.system.range.reach || 5;
    const targets = tokenUtils.findNearby(puppet, range).filter(token => token !== puppet);
    if (!targets.length) return;
    const target = (await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.Legacy.BloodCurses.SelectTarget', targets, {userId}))?.result;
    if (!target) return;
    let bonusEffect;
    if (amplified) [bonusEffect] = await effectUtils.createEffects(puppet.actor, [{name: item.name, img: item.img, system: {changes: ['mwak', 'rwak', 'msak', 'rsak'].map(key => ({key: 'system.bonuses.' + key + '.attack', type: 'add', value: String(hemocraftModifier(owner)), priority: 20}))}, flags: {dae: {specialDuration: ['1Attack']}}}]);
    await workflowUtils.completeActivityUse(weapon.system.activities.find(entry => entry.type === 'attack'), [target], {userId: queryUtils.gmID()});
    if (bonusEffect) await documentUtils.deleteDocument(bonusEffect);
}
async function bloatedAttack({document: effect, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'attack') || !workflow.token || !combatUtils.isOwnTurn(workflow.token.document)) return;
    const combatData = tokenUtils.getCombatData(workflow.token.document);
    if (!combatData.inCombat) return;
    const stamps = effect.flags['chris-premades']?.bloatedAgony ?? {};
    const key = combatData.combatId + '.' + combatData.currentRound + '.' + combatData.currentCombatantId;
    const count = (stamps.key === key ? stamps.count : 0) + 1;
    await documentUtils.setFlag(effect, 'chris-premades', 'bloatedAgony', {key, count});
    if (count !== 2) return;
    const activity = itemUtils.getActivityByIdentifier(effectUtils.getOriginActivitySync(effect)?.item, 'agony-damage');
    if (activity) await workflowUtils.completeActivityUse(activity, [workflow.token.document]);
}
function exposureTypes(ditem) {
    return Array.from(new Set(ditem.calculatedDamages.filter(entry => entry.active?.type?.resistance || entry.active?.type?.immunity).map(entry => entry.type)));
}
function exposeDamage(ditem, types, amplified) {
    for (const entry of [...ditem.calculatedDamages]) {
        if (!types.includes(entry.type)) continue;
        if (entry.active?.type?.immunity && amplified) workflowUtils.modifyDamageAppliedFlat(ditem, Math.trunc(entry.damage / 2), {type: entry.type});
        else if (!amplified && entry.active?.type?.resistance && !entry.active?.type?.immunity) workflowUtils.modifyDamageAppliedFlat(ditem, entry.damage - entry.value, {type: entry.type});
    }
}
async function exposure({document: item, ditem, targetToken, workflow}) {
    if (!targetToken?.actor || !ditem?.isHit) return;
    const owner = item.actor;
    const existing = documentUtils.getEffectByIdentifier(targetToken.actor, 'bloodCurseOfExposure', {sourceActor: owner});
    if (existing) return exposeDamage(ditem, existing.flags['chris-premades']?.exposure?.types ?? [], existing.flags['chris-premades']?.exposure?.amplified);
    if (!workflowUtils.isAttackType(workflow, 'attack') && workflow.item?.type !== 'spell') return;
    if (targetToken.actor === owner || actorUtils.hasUsedReaction(owner)) return;
    const ownerToken = actorUtils.getFirstToken(owner);
    if (!ownerToken || !tokenUtils.isWithinDistance(ownerToken, targetToken, 30) || !tokenUtils.canSee(ownerToken, targetToken)) return;
    const types = exposureTypes(ditem);
    if (!types.length || !activityUtils.checkCosts(itemUtils.getActivityByIdentifier(item, 'curse'))) return;
    const activity = await chooseCurse(item, queryUtils.firstOwner(owner, true));
    if (!activity) return;
    const amplified = activity.identifier === 'amplify';
    exposeDamage(ditem, types, amplified);
    await workflowUtils.completeActivityUse(activity, [targetToken]);
    await actorUtils.setReactionUsed(owner);
    const effect = documentUtils.getEffectByIdentifier(targetToken.actor, 'bloodCurseOfExposure', {sourceActor: owner});
    if (effect) await documentUtils.setFlag(effect, 'chris-premades', 'exposure', {types, amplified});
}
function exorcistEffects(actor) {
    return actorUtils.getEffects(actor).filter(effect => ['charmed', 'frightened'].some(status => effect.statuses.has(status)) || /possess/i.test(effect.name));
}
const targetChecks = {
    'blood-curses-blood-curse-of-binding': (actor, activity) => activity.identifier !== 'curse' || ['tiny', 'sm', 'med', 'lg'].includes(actorUtils.getSize(actor, true)),
    'blood-curse-of-the-exorcist': actor => exorcistEffects(actor).length > 0,
    'blood-curses-blood-curse-of-the-muddled-mind': actor => !!effectUtils.getConcentrationEffect(actor)
};
async function requireTarget({document: item, workflow}) {
    const check = targetChecks[documentUtils.getIdentifier(item)];
    if (!check || !['curse', 'amplify'].includes(workflow.activity.identifier)) return;
    if (workflow.targets.documents.every(token => token.actor && check(token.actor, workflow.activity))) return;
    genericUtils.notify('CHRISPREMADES.Macros.Legacy.BloodCurses.InvalidTarget', {type: 'warn', format: {feature: item.name}});
    workflow.aborted = true;
    return true;
}
async function exorcist({document: item, workflow}) {
    if (!['curse', 'amplify'].includes(workflow.activity.identifier)) return;
    const target = workflow.targets.documents[0];
    if (!target?.actor) return;
    const effects = exorcistEffects(target.actor);
    const sourceActor = effect => effectUtils.getOriginActivitySync(effect)?.actor ?? fromUuidSync(effect.origin, {strict: false})?.parent?.actor;
    const sources = new Set(effects.map(sourceActor).filter(actor => actor && actor !== target.actor));
    await Promise.all(effects.map(effect => documentUtils.deleteDocument(effect)));
    if (workflow.activity.identifier !== 'amplify') return;
    const punish = itemUtils.getActivityByIdentifier(item, 'punish');
    const tokens = Array.from(sources).map(actor => actorUtils.getFirstToken(actor)).filter(Boolean);
    if (punish && tokens.length) await workflowUtils.completeActivityUse(punish, tokens);
}
async function howlPreamble({workflow}) {
    if (!['curse', 'amplify'].includes(workflow.activity.identifier)) return;
    const allowed = workflow.targets.documents.filter(token => !token.actor?.statuses.has('deafened') && !actorUtils.getEffectByIdentifier(token.actor, 'bloodCurseOfTheHowlImmune'));
    if (allowed.length !== workflow.targets.count) await workflowUtils.updateTargets(workflow, allowed);
}
async function howl({document: item, workflow}) {
    if (!['curse', 'amplify'].includes(workflow.activity.identifier)) return;
    const dc = workflow.activity.save.dc.value;
    const stunned = workflow.failedSaves.documents.filter(token => (workflow.tokenSaves?.[token.uuid]?.total ?? dc) <= dc - 5);
    const stun = itemUtils.getActivityByIdentifier(item, 'stun');
    if (stun && stunned.length) {
        await workflowUtils.completeActivityUse(stun, stunned);
        await Promise.all(stunned.map(async token => {
            const fear = documentUtils.getEffectByIdentifier(token.actor, 'bloodCurseOfTheHowl', {sourceActor: item.actor});
            const stunEffect = documentUtils.getEffectByIdentifier(token.actor, 'bloodCurseOfTheHowlStun', {sourceActor: item.actor});
            if (fear && stunEffect) await documentUtils.makeDependent(fear, [stunEffect]);
        }));
    }
    const immune = itemUtils.getActivityByIdentifier(item, 'immune');
    const saved = workflow.targets.documents.filter(token => !workflow.failedSaves.has(token));
    if (immune && saved.length) await workflowUtils.completeActivityUse(immune, saved);
}
export const bloodCurseOfTheFallenPuppet = {
    name: 'Blood Curse of the Fallen Puppet',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'sceneRollFinished',
            macro: fallenPuppet,
            priority: 60
        }
    ]
};
export const bloodCurseOfBloatedAgonyEffect = {
    name: 'Blood Curse of Bloated Agony: Effect',
    version: bloodCurseOfTheFallenPuppet.version,
    rules: '2014',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: bloatedAttack,
            priority: 50
        }
    ]
};
export const bloodCurseOfExposure = {
    name: 'Blood Curse of Exposure',
    version: bloodCurseOfTheFallenPuppet.version,
    rules: '2014',
    roll: [
        {
            pass: 'sceneDamage',
            macro: exposure,
            priority: 50
        }
    ]
};
export const bloodCurseTarget = {
    name: 'Blood Curse: Target',
    version: bloodCurseOfTheFallenPuppet.version,
    rules: '2014',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: requireTarget,
            priority: 10
        }
    ]
};
export const bloodCurseOfTheExorcist = {
    name: 'Blood Curse of the Exorcist',
    version: bloodCurseOfTheFallenPuppet.version,
    rules: '2014',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: requireTarget,
            priority: 10
        },
        {
            pass: 'itemRollFinished',
            macro: exorcist,
            priority: 50
        }
    ]
};
export const bloodCurseOfTheHowl = {
    name: 'Blood Curse of the Howl',
    version: bloodCurseOfTheFallenPuppet.version,
    rules: '2014',
    roll: [
        {
            pass: 'itemPreambleComplete',
            macro: howlPreamble,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: howl,
            priority: 50
        }
    ]
};
