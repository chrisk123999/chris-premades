import cprConstants from '../../constants.mjs';
import {actorUtils, automationUtils, compendiumUtils, constants, documentUtils, effectUtils, genericUtils, itemUtils, rollUtils} from '../../proxy.mjs';
import {startHoldingBreath} from '../all/actions/holdBreath.mjs';
import {underwaterLegacy, underwaterModern} from '../all/actions/underwater.mjs';
import {getBreathing} from './breathing.mjs';
const effectMacros = ['move', 'combat', 'time', 'effect'].map(type => ({type, macros: [{source: 'chris-premades', rules: 'all', identifier: 'environmentEffect'}]}));
const exposureImages = {
    extremeCold: 'icons/magic/water/barrier-ice-wall-snow.webp',
    extremeHeat: 'icons/magic/fire/beam-jet-stream-embers.webp',
    highAltitude: 'icons/magic/air/air-wave-gust-blue.webp'
};
function getConfig(area, key) {
    if (!area) return environment.genericConfig[key].default;
    return automationUtils.getGenericConfigValue(area, 'chris-premades', 'environment', key, {rules: 'all'});
}
function getAreas(token) {
    const scene = token.parent;
    return [scene, scene.levels?.get(token.level), ...token.regions].filter(area => area?.flags.cat?.genericConfig?.['chris-premades']?.environment && (getConfig(area, 'timing') !== 'combat' || token.inCombat));
}
function getNeeded(token) {
    const needed = new Map();
    for (const area of getAreas(token)) {
        for (const environment of getConfig(area, 'environments')) {
            if (!needed.has(environment)) needed.set(environment, area);
        }
    }
    const breathing = getBreathing(token.actor);
    const breathArea = needed.has('breathableAir') ? undefined : (breathing ? undefined : needed.get('underwater')) ?? (breathing === 'none' ? undefined : needed.get('noAir'));
    needed.delete('noAir');
    needed.delete('breathableAir');
    if (breathArea) needed.set('breath', breathArea);
    return needed;
}
async function getActionItem(actor, identifier) {
    const item = actorUtils.getItemByIdentifier(actor, identifier);
    if (item) return item;
    const rules = game.settings.get('dnd5e', 'rulesVersion') === 'legacy' ? 'legacy' : 'modern';
    return await compendiumUtils.getDocumentByIdentifier(cprConstants.packs[rules].misc, identifier);
}
async function getUnderwaterData(actor, flags) {
    const item = await getActionItem(actor, 'underwater');
    const effect = item?.effects.find(effect => effect.flags.cat?.identifier === 'underwater');
    if (!effect) return;
    const effectData = documentUtils.getEffectData(item, effect.id, {macros: effectMacros});
    const {config} = documentUtils.getRules(item) === '2014' ? underwaterLegacy : underwaterModern;
    genericUtils.mergeObject(effectData, {flags: {...flags, cat: {config: automationUtils.getConfigValues(item, Object.keys(config))}}});
    return effectData;
}
function getExposureData(environment, area, flags) {
    const effectData = documentUtils.getBaseEffectData(area, {
        name: _loc('CHRISPREMADES.Macros.Generic.Environment.' + environment.capitalize()),
        img: exposureImages[environment],
        macros: effectMacros
    });
    genericUtils.mergeObject(effectData, {flags: {'chris-premades': {...flags['chris-premades'], environmentStart: game.time.worldTime}}});
    return effectData;
}
const pending = new Map();
export function syncEnvironment(token) {
    if (!token.actor) return;
    const key = token.actor.uuid;
    const next = (pending.get(key) ?? Promise.resolve()).then(() => sync(token));
    pending.set(key, next);
    next.finally(() => {
        if (pending.get(key) === next) pending.delete(key);
    });
    return next;
}
async function sync(token) {
    const actor = token.actor;
    if (!actor) return;
    const needed = getNeeded(token);
    const current = actorUtils.getEffects(actor).filter(effect => effect.flags['chris-premades']?.environment);
    const stale = current.filter(effect => !needed.has(effect.flags['chris-premades'].environment));
    if (stale.length) await documentUtils.deleteEmbeddedDocuments(actor, 'ActiveEffect', stale.map(effect => effect.id));
    const effectDatas = [];
    for (const [environment, area] of needed) {
        if (current.some(effect => effect.flags['chris-premades'].environment === environment && effect.flags['chris-premades'].environmentArea)) continue;
        const flags = {'chris-premades': {environment, environmentArea: area.uuid}};
        if (environment === 'breath') {
            const item = await getActionItem(actor, 'hold-breath');
            if (item) await startHoldingBreath(actor, item, {flags, macros: effectMacros});
        } else if (environment === 'underwater') {
            const effectData = await getUnderwaterData(actor, flags);
            if (effectData) effectDatas.push(effectData);
        } else {
            effectDatas.push(getExposureData(environment, area, flags));
        }
    }
    if (effectDatas.length) await effectUtils.createEffects(actor, effectDatas);
}
async function syncTokens({token, tokens}) {
    for (const tokenDocument of tokens ?? [token]) if (tokenDocument) await syncEnvironment(tokenDocument);
}
async function syncEffect({document: effect, token}) {
    if (token) await syncEnvironment(token);
}
async function grantDrinkWater({document: effect}) {
    const actor = effectUtils.getActor(effect);
    if (effect.flags['chris-premades']?.environment !== 'extremeHeat' || !actor || actorUtils.getItemByIdentifier(actor, 'drink-water')) return;
    const itemData = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.misc.automationItems, 'drink-water', {object: true});
    if (itemData) await itemUtils.createItems(actor, [itemData], {favorite: true, parentEntity: effect});
}
function hasIdentifier(actor, identifiers) {
    if (!identifiers?.length) return false;
    if (actor.items.some(item => identifiers.includes(item.system.identifier) && item.system.equipped !== false)) return true;
    return actorUtils.getEffects(actor).some(effect => effect.active && identifiers.includes(effect.flags.cat?.identifier));
}
async function exposure({document: effect, worldTime}) {
    const {environment, environmentArea, environmentStart, environmentHours = 0} = effect.flags['chris-premades'] ?? {};
    if (!['extremeCold', 'extremeHeat'].includes(environment)) return;
    const area = fromUuidSync(environmentArea, {strict: false});
    const hours = Math.floor((worldTime - environmentStart) / getConfig(area, 'saveInterval'));
    if (hours <= environmentHours) return;
    await documentUtils.setFlag(effect, 'chris-premades', 'environmentHours', hours);
    const actor = effectUtils.getActor(effect);
    const isCold = environment === 'extremeCold';
    const damageType = isCold ? 'cold' : 'fire';
    if (!actor || actorUtils.checkTrait(actor, 'dr', damageType) || actorUtils.checkTrait(actor, 'di', damageType)) return;
    if (hasIdentifier(actor, getConfig(area, isCold ? 'coldIdentifiers' : 'heatIdentifiers'))) return;
    const armor = actor.system.attributes.ac?.equippedArmor?.system.type.value;
    const disadvantage = !isCold && (getConfig(area, 'heatArmorTypes').includes(armor) || hasIdentifier(actor, getConfig(area, 'heatDisadvantageIdentifiers')));
    for (let hour = environmentHours + 1; hour <= hours; hour++) {
        const drankWater = !isCold && actorUtils.getEffectByIdentifier(actor, 'drankWater');
        if (drankWater) {
            await documentUtils.deleteDocument(drankWater);
            continue;
        }
        const rollDC = isCold ? getConfig(area, 'coldDC') : getConfig(area, 'heatDC') + (hour - 1) * getConfig(area, 'heatDCIncrease');
        const roll = await rollUtils.requestRoll(actor, 'save', 'con', {rollDC, disadvantage});
        if (roll && roll.total < rollDC) await actorUtils.addExhaustion(actor, getConfig(area, 'exhaustion'));
    }
}
/**
 * Applies environment effects to tokens in this scene, level or region.
 * Underwater and No Air start Holding Breath unless the creature can breathe there. Breathable Air in any overlapping area cancels that.
 * Extreme Cold and Extreme Heat roll a Constitution save each hour of world time. Extreme Heat grants a Drink Water item, and drinking skips the next heat save.
 * Effects are removed once the token is in no matching area.
 * Bound on a scene, level or region. Fires when a token is placed, moves, enters or leaves, and when combat starts.
 *
 * Config:
 * - `environments`: environments the area has.
 * - `timing`: always, or only while the token is in combat.
 * - `coldIdentifiers`, `heatIdentifiers`: items or effects that make the save succeed.
 * - `heatDisadvantageIdentifiers`: items or effects that give disadvantage on the heat save.
 * - Homebrew: `saveInterval`, `coldDC`, `heatDC`, `heatDCIncrease`, `heatArmorTypes` and `exhaustion`.
 */
export const environment = {
    rules: 'all',
    version: '2.1.8',
    category: 'mechanics',
    generic: true,
    documents: ['scene', 'level', 'region'],
    move: [
        {pass: 'sceneMoved', macro: syncTokens, priority: 50, unique: 'environmentSync'},
        {pass: 'levelMoved', macro: syncTokens, priority: 50, unique: 'environmentSync'}
    ],
    region: [
        {pass: 'enter', macro: syncTokens, priority: 50},
        {pass: 'left', macro: syncTokens, priority: 50},
        {pass: 'entered', macro: syncTokens, priority: 50},
        {pass: 'exited', macro: syncTokens, priority: 50}
    ],
    combat: [
        {pass: 'sceneCombatStart', macro: syncTokens, priority: 50, unique: 'environmentSync'},
        {pass: 'levelCombatStart', macro: syncTokens, priority: 50, unique: 'environmentSync'},
        {pass: 'regionCombatStart', macro: syncTokens, priority: 50, unique: 'environmentSync'}
    ],
    genericConfig: {
        environments: {
            default: [],
            type: 'select-many',
            label: 'CHRISPREMADES.Macros.Generic.Environment.Environments',
            options: ['underwater', 'noAir', 'breathableAir', 'extremeCold', 'extremeHeat', 'highAltitude'].map(value => ({value, label: 'CHRISPREMADES.Macros.Generic.Environment.' + value.capitalize()}))
        },
        timing: {
            default: 'always',
            type: 'select',
            label: 'CHRISPREMADES.Macros.Generic.Environment.Timing',
            hint: 'CHRISPREMADES.Macros.Generic.Environment.TimingHint',
            options: [
                {value: 'always', label: 'CHRISPREMADES.Macros.Generic.Environment.Always'},
                {value: 'combat', label: 'CHRISPREMADES.Macros.Generic.Environment.Combat'}
            ]
        },
        coldIdentifiers: {
            showIf: ({environments}) => environments.includes('extremeCold'),
            default: [],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Macros.Generic.Environment.ColdIdentifiers',
            hint: 'CHRISPREMADES.Macros.Generic.Environment.ColdIdentifiersHint'
        },
        heatIdentifiers: {
            showIf: ({environments}) => environments.includes('extremeHeat'),
            default: [],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Macros.Generic.Environment.HeatIdentifiers',
            hint: 'CHRISPREMADES.Macros.Generic.Environment.HeatIdentifiersHint'
        },
        heatDisadvantageIdentifiers: {
            showIf: ({environments}) => environments.includes('extremeHeat'),
            default: [],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Macros.Generic.Environment.HeatDisadvantageIdentifiers',
            hint: 'CHRISPREMADES.Macros.Generic.Environment.HeatDisadvantageIdentifiersHint'
        },
        saveInterval: {
            showIf: ({environments}) => environments.some(environment => ['extremeCold', 'extremeHeat'].includes(environment)),
            default: 3600,
            type: 'number',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Generic.Environment.SaveInterval',
            hint: 'CHRISPREMADES.Macros.Generic.Environment.SaveIntervalHint'
        },
        coldDC: {
            showIf: ({environments}) => environments.includes('extremeCold'),
            default: 10,
            type: 'number',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Generic.Environment.ColdDC',
            hint: 'CHRISPREMADES.Macros.Generic.Environment.ColdDCHint'
        },
        heatDC: {
            showIf: ({environments}) => environments.includes('extremeHeat'),
            default: 5,
            type: 'number',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Generic.Environment.HeatDC',
            hint: 'CHRISPREMADES.Macros.Generic.Environment.HeatDCHint'
        },
        heatDCIncrease: {
            showIf: ({environments}) => environments.includes('extremeHeat'),
            default: 1,
            type: 'number',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Generic.Environment.HeatDCIncrease',
            hint: 'CHRISPREMADES.Macros.Generic.Environment.HeatDCIncreaseHint'
        },
        heatArmorTypes: {
            showIf: ({environments}) => environments.includes('extremeHeat'),
            default: ['medium', 'heavy'],
            type: 'select-many',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Generic.Environment.HeatArmorTypes',
            hint: 'CHRISPREMADES.Macros.Generic.Environment.HeatArmorTypesHint',
            get options() { return constants.armorOptions; }
        },
        exhaustion: {
            showIf: ({environments}) => environments.some(environment => ['extremeCold', 'extremeHeat'].includes(environment)),
            default: 1,
            type: 'number',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Generic.Environment.Exhaustion',
            hint: 'CHRISPREMADES.Macros.Generic.Environment.ExhaustionHint'
        }
    }
};
export const environmentEffect = {
    name: 'Environment',
    version: environment.version,
    rules: 'all',
    move: [
        {pass: 'actorMoved', macro: syncEffect, priority: 50, unique: 'environmentSync'}
    ],
    combat: [
        {pass: 'actorCombatEnd', macro: syncEffect, priority: 50, unique: 'environmentSync'}
    ],
    time: [
        {pass: 'actorTimeUpdated', macro: exposure, priority: 50}
    ],
    effect: [
        {pass: 'created', macro: grantDrinkWater, priority: 50}
    ]
};
export const environmentHooks = {
    createToken(token, _options, userId) {
        if (userId === game.user.id) syncEnvironment(token);
    }
};
