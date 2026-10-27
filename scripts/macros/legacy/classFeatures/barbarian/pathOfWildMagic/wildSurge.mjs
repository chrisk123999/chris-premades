import {actorUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, queryUtils, summonUtils, rollUtils, tokenUtils, workflowUtils, Logging} from '../../../../../proxy.mjs';
const translations = 'CHRISPREMADES.Macros.Legacy.WildSurge.';
const results = ['shadowyTendrils', 'teleport', 'intangibleSpirit', 'magicInfusion', 'retribution', 'protectiveLights', 'flowersAndVines', 'boltOfLight'];
const repeatable = {teleport: 'teleport', intangibleSpirit: 'intangible-spirit', boltOfLight: 'bolt-of-light'};
const aura = (dispositions, effect, radius) => ({
    macros: {aura: [{source: 'cat', rules: 'all', identifier: 'aura'}]},
    genericConfig: {cat: {aura: {radius, dispositions, includeSelf: dispositions.includes('ally'), effect}}}
});
async function pickResult(item, token) {
    const controlled = actorUtils.getItemByIdentifier(item.actor, 'controlled-surge');
    const roll = await rollUtils.rollDice(controlled ? '2d8' : '1d8');
    const rolled = roll.dice[0].results.map(result => results[result.result - 1]);
    await roll.toMessage({speaker: ChatMessage.implementation.getSpeaker({token}), flavor: item.name + (controlled ? '' : ': ' + _loc(translations + rolled[0].capitalize()))});
    if (!controlled) return rolled[0];
    const options = rolled[0] === rolled[1] ? results : rolled;
    const selection = await dialogUtils.buttonDialog(item.name, translations + 'Select', options.map(result => [translations + result.capitalize(), result]), {userId: queryUtils.firstOwner(item.actor, true)});
    return selection || options[0];
}
async function infuse(item, marker) {
    const weapons = item.actor.itemTypes.weapon.filter(w => w.system.type.value !== 'unarmed' && w.system.equipped);
    if (!weapons.length) return Logging.addMacroWarning('chris-premades', 'wild-surge-magicInfusion', 'CHRISPREMADES.Macros.Legacy.DedicatedWeapon.NoValid', {notify: true});
    const weapon = weapons.length > 1 ? await dialogUtils.selectDocumentDialog(item.name, translations + 'SelectWeapon', weapons) : weapons[0];
    if (!weapon) return;
    const changes = [
        {key: 'name', type: 'override', value: '{} (' + _loc(translations + 'MagicInfusion') + ')', priority: 20},
        {key: 'system.damage.base.types', type: 'override', value: ['force'], priority: 20},
        {key: 'system.properties', type: 'add', value: 'thr', priority: 20},
        {key: 'system.properties', type: 'add', value: 'lgt', priority: 20},
        {key: 'system.range.value', type: 'override', value: '20', priority: 20},
        {key: 'system.range.long', type: 'override', value: '60', priority: 20}
    ];
    if (weapon.system.properties.has('ver')) changes.push({key: 'system.damage.versatile.types', type: 'override', value: ['force'], priority: 20});
    await itemUtils.enchantItem(weapon, {
        img: item.img,
        name: item.name,
        origin: item.uuid,
        system: {changes},
        flags: {dnd5e: {dependentOn: marker.uuid}}
    });
}
async function surge({document: item, data: {effect: rage, token} = {}}) {
    const activity = itemUtils.getActivityByIdentifier(item, 'wild-surge');
    if (!activity || !rage) return;
    const previous = actorUtils.getEffectByIdentifier(item.actor, 'wildSurge');
    if (previous) await documentUtils.deleteDocument(previous);
    const result = await pickResult(item, token);
    const markerData = documentUtils.getBaseEffectData(activity, {
        name: item.name + ': ' + _loc(translations + result.capitalize()),
        img: item.img,
        origin: item.uuid,
        identifier: 'wildSurge',
        activityUuid: activity.uuid,
        unhideActivities: repeatable[result] ? [repeatable[result]] : undefined,
        favoriteActivities: !!repeatable[result],
        macros: result === 'retribution' ? [{type: 'roll', macros: [{source: 'chris-premades', rules: '2014', identifier: 'wild-surge-retribution'}]}] : undefined
    });
    if (result === 'protectiveLights') genericUtils.mergeObject(markerData, {flags: {cat: aura(['ally'], 'protectiveLight1', '10')}});
    const [marker] = await effectUtils.createEffects(item.actor, [markerData], {parentEntity: rage}) ?? [];
    if (!marker) return;
    const use = (identifier, targets = []) => workflowUtils.syntheticActivityRoll(itemUtils.getActivityByIdentifier(item, identifier), targets, {consumeUsage: false, consumeResources: false, spellSlot: false});
    switch (result) {
        case 'shadowyTendrils':
            await use('shadowy-tendrils', tokenUtils.findNearby(token, 30, {disposition: 'enemy'}));
            await use('shadowy-tendrils-temp', [token]);
            break;
        case 'teleport':
            await use('teleport');
            break;
        case 'intangibleSpirit':
            await use('intangible-spirit');
            break;
        case 'magicInfusion':
            await infuse(item, marker);
            break;
        case 'flowersAndVines':
            await use('flowers-and-vines');
            break;
        case 'boltOfLight': {
            const nearby = tokenUtils.findNearby(token, 30, {disposition: 'enemy'});
            if (!nearby.length) return;
            const selection = nearby.length > 1 ? await dialogUtils.selectTargetDialog(item.name, translations + 'Target', nearby, {skipDeadAndUnconscious: false, userId: queryUtils.firstOwner(item.actor, true)}) : {result: nearby[0]};
            if (selection?.result) await use('bolt-of-light', [selection.result]);
        }
    }
}
async function manualSurge({document: activity, token}) {
    if (!token) return;
    const effect = actorUtils.getEffectByIdentifier(activity.actor, 'rage');
    if (effect) await surge({document: activity.item, data: {effect, token}});
}
async function explode({document}) {
    const activity = itemUtils.getActivityByIdentifier(document, 'intangible-explode');
    const spirits = summonUtils.getSummonsBySource(document).filter(summon => summon.token);
    for (const spirit of spirits) {
        const targets = tokenUtils.findNearby(spirit.token, 5);
        if (activity && targets.length) await workflowUtils.syntheticActivityRoll(activity, targets, {consumeUsage: false, consumeResources: false, spellSlot: false});
        await summonUtils.deleteSummon(spirit);
    }
}
async function retribution({document: effect, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'attack') || !workflow.token) return;
    const actor = effect.parent;
    if (!Array.from(workflow.hitTargets).some(token => token.actor === actor)) return;
    const item = actorUtils.getItemByIdentifier(actor, 'wild-surge');
    const activity = item ? itemUtils.getActivityByIdentifier(item, 'retribution') : undefined;
    if (activity) await workflowUtils.syntheticActivityRoll(activity, [workflow.token.document], {consumeUsage: false, consumeResources: false, spellSlot: false});
}
async function flowers({regions, workflow}) {
    const marker = actorUtils.getEffectByIdentifier(workflow.actor, 'wildSurge');
    if (!marker) return;
    const enemy = -1 * workflow.token.document.disposition || -1;
    await documentUtils.update(regions[0], {
        'flags.dnd5e.dependentOn': marker.uuid,
        behaviors: [{
            type: 'dnd5e.difficultTerrain',
            system: {
                ignoredDispositions: [-1, 0, 1].filter(d => d !== enemy),
                types: ['plants'],
                magical: true
            }
        }]
    });
}
export const wildSurge = {
    name: 'Wild Surge',
    version: '2.1.3',
    rules: '2014',
    called: [{pass: 'actorRageBegin', macro: surge, priority: 50}],
    combat: [{pass: 'actorEveryTurn', macro: explode, priority: 50}]
};
export const wildSurgeManual = {
    version: wildSurge.version,
    rules: wildSurge.rules,
    roll: [{pass: 'activityRollFinished', macro: manualSurge, priority: 50}]
};
export const wildSurgeRetribution = {
    name: 'Wild Surge: Retribution',
    version: wildSurge.version,
    rules: wildSurge.rules,
    roll: [{pass: 'targetRollFinished', macro: retribution, priority: 250}]
};
export const wildSurgeFlowers = {
    version: wildSurge.version,
    rules: wildSurge.rules,
    region: [{pass: 'created', macro: flowers, priority: 50}]
};
