import {actorUtils, dialogUtils, documentUtils, effectUtils, genericUtils, queryUtils, summonUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
const translations = 'CHRISPREMADES.Macros.Legacy.ManifestEcho.';
function getEchoes(actor) {
    const item = actorUtils.getItemByIdentifier(actor, 'manifest-echo');
    return item ? summonUtils.getSummonsBySource(item).filter(summon => summon.token) : [];
}
async function pickEcho(workflow) {
    const echoes = getEchoes(workflow.actor);
    if (echoes.length < 2) return echoes[0]?.token;
    const selection = await dialogUtils.selectTargetDialog(workflow.item.name, translations + 'Which', echoes.map(echo => echo.token), {skipDeadAndUnconscious: false});
    return selection?.result;
}
async function preCreate({document, updates}) {
    const owner = document.actor;
    const ownerToken = actorUtils.getFirstToken(owner);
    const name = _loc(translations + 'Echo', {name: ownerToken?.name ?? owner.name});
    genericUtils.setProperty(updates, 'name', name);
    genericUtils.setProperty(updates, 'system.abilities', owner.system.toObject().abilities);
    genericUtils.setProperty(updates, 'system.traits.size', owner.system.traits.size);
    genericUtils.setProperty(updates, 'system.details.type', owner.system.toObject().details.type);
    genericUtils.setProperty(updates, 'prototypeToken.name', name);
    genericUtils.setProperty(updates, 'prototypeToken.sight', owner.prototypeToken.toObject().sight);
    if (!ownerToken) return;
    genericUtils.setProperty(updates, 'prototypeToken.width', ownerToken.width);
    genericUtils.setProperty(updates, 'prototypeToken.height', ownerToken.height);
    if (!genericUtils.getProperty(updates, 'prototypeToken.texture.src')) genericUtils.setProperty(updates, 'prototypeToken.texture.src', ownerToken.texture.src);
}
async function swap({workflow}) {
    const echo = await pickEcho(workflow);
    if (echo && workflow.token) await tokenUtils.swapTokens(workflow.token.document, echo);
}
export async function attackFromEcho({workflow}) {
    if (!workflow.targets.size) return;
    const echo = await pickEcho(workflow);
    if (!echo) return;
    const weapons = workflow.actor.items.filter(item => item.hasAttack && (item.type !== 'weapon' || item.system.equipped));
    if (!weapons.length) {
        genericUtils.notify(translations + 'NoWeapons', {type: 'info'});
        return;
    }
    const weapon = weapons.length > 1 ? await dialogUtils.selectDocumentDialog(workflow.item.name, translations + 'Weapon', weapons) : weapons[0];
    if (!weapon) return;
    const effectData = {
        name: _loc(translations + 'RangeOverride'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        system: {changes: [{key: 'flags.midi-qol.rangeOverride.attack.all', type: 'custom', value: '1', priority: 20}]}
    };
    const effects = (await effectUtils.createEffects(workflow.actor, [effectData])) ?? [];
    try {
        await workflowUtils.syntheticItemRoll(weapon, Array.from(workflow.targets));
    } finally {
        await Promise.all(effects.map(effect => documentUtils.deleteDocument(effect)));
    }
}
async function dismiss({workflow}) {
    await Promise.all(getEchoes(workflow.actor).map(echo => summonUtils.deleteSummon(echo)));
}
async function use({workflow}) {
    switch (workflow.activity.identifier) {
        case 'teleport': return await swap({workflow});
        case 'attack': return await attackFromEcho({workflow});
        case 'dismiss': return await dismiss({workflow});
    }
}
async function turnEnd({document, token}) {
    const range = actorUtils.getEffectByIdentifier(document.actor, 'echoAvatar') ? 1000 : 30;
    const far = summonUtils.getSummonsBySource(document).filter(echo => echo.token && tokenUtils.getDistance(token, echo.token) > range);
    for (const echo of far) {
        if (await dialogUtils.confirm(document.name, _loc(translations + 'Far', {actorName: token.name}), {userId: queryUtils.gmID()})) await summonUtils.deleteSummon(echo);
    }
}
async function destroyed({document, summon}) {
    if (summon.actor?.system.attributes.hp.value > 0) return;
    const owner = document.actor;
    if (owner.system.attributes.hp.temp) return;
    const reclaim = actorUtils.getItemByIdentifier(owner, 'reclaim-potential');
    if (!reclaim?.system.uses.value) return;
    if (!await dialogUtils.confirmUseItem(reclaim, {userId: queryUtils.firstOwner(owner, true)})) return;
    await workflowUtils.completeItemUse(reclaim);
}
async function legion({document}) {
    const unleash = actorUtils.getItemByIdentifier(document.actor, 'unleash-incarnation');
    if (!unleash || unleash.system.uses.value) return;
    await documentUtils.update(unleash, {'system.uses.spent': unleash.system.uses.spent - 1});
}
async function avatar({workflow}) {
    const existing = actorUtils.getEffectByIdentifier(workflow.actor, 'echoAvatar');
    if (existing) {
        await documentUtils.deleteDocument(existing);
        return;
    }
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {name: workflow.item.name, img: workflow.item.img, origin: workflow.item.uuid, identifier: 'echoAvatar'});
    effectData.statuses = ['blinded', 'deafened'];
    await effectUtils.createEffects(workflow.actor, [effectData]);
}
export const manifestEcho = {
    name: 'Manifest Echo',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ],
    summon: [
        {pass: 'preCreate', macro: preCreate, priority: 40},
        {pass: 'delete', macro: destroyed, priority: 50}
    ],
    combat: [
        {pass: 'actorTurnEnd', macro: turnEnd, priority: 50}
    ]
};
export const unleashIncarnation = {
    name: 'Unleash Incarnation',
    version: manifestEcho.version,
    rules: manifestEcho.rules,
    roll: [
        {pass: 'itemRollFinished', macro: attackFromEcho, priority: 50}
    ]
};
export const legionOfOne = {
    name: 'Legion of One',
    version: manifestEcho.version,
    rules: manifestEcho.rules,
    combat: [
        {pass: 'actorCombatStart', macro: legion, priority: 50}
    ]
};
export const echoAvatar = {
    name: 'Echo Avatar',
    version: manifestEcho.version,
    rules: manifestEcho.rules,
    roll: [
        {pass: 'itemRollFinished', macro: avatar, priority: 50}
    ]
};
