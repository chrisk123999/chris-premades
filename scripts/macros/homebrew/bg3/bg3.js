import {backbreaker} from './backbreaker.js';
import {brace} from './brace.js';
import {cleave} from './cleave.js';
import {concussiveSmash} from './concussiveSmash.js';
import {maimingStrike} from './maimingStrike.js';
import {flourish} from './flourish.js';
import {hamstringShot} from './hamstringShot.js';
import {heartstopper} from './heartstopper.js';
import {lacerate} from './lacerate.js';
import {piercingStrike} from './piercingStrike.js';
import {pommelStrike} from './pommelStrike.js';
import {prepare} from './prepare.js';
import {rushAttack} from './rushAttack.js';
import {tenacity} from './tenacity.js';
import {topple} from './topple.js';
import {weakeningStrike} from './weakeningStrike.js';
import {mobileShot} from './mobileShot.js';
import {chris} from '../../../helperFunctions.js';
let weapons = {
    'warhammer': [
        'Backbreaker',
        'Concussive Smash',
        'Weakening Strike'
    ],
    'maul': [
        'Backbreaker',
        'Concussive Smash',
        'Tenacity'
    ],
    'glaive': [
        'Brace',
        'Lacerate',
        'Rush Attack'
    ],
    'pike': [
        'Brace',
        'Piercing Strike',
        'Rush Attack'
    ],
    'longbow': [
        'Brace',
        'Hamstring Shot'
    ],
    'battleaxe': [
        'Cleave',
        'Lacerate',
        'Maiming Strike'
    ],
    'greataxe': [
        'Cleave',
        'Lacerate',
        'Prepare'
    ],
    'halberd': [
        'Cleave',
        'Lacerate',
        'Rush Attack'
    ],
    'greatsword': [
        'Cleave',
        'Lacerate',
        'Pommel Strike'
    ],
    'morningstar': [
        'Concussive Smash',
        'Heartstopper',
        'Tenacity'
    ],
    'club': [
        'Concussive Smash'
    ],
    'lighthammer': [
        'Concussive Smash'
    ],
    'mace': [
        'Concussive Smash'
    ],
    'greatclub': [
        'Concussive Smash',
        'Tenacity'
    ],
    'scimitar': [
        'Flourish',
        'Lacerate'
    ],
    'shortsword': [
        'Flourish',
        'Piercing Strike'
    ],
    'rapier': [
        'Flourish',
        'Piercing Strike',
        'Weakening Strike'
    ],
    'shortbow': [
        'Hamstring Shot'
    ],
    'handaxe': [
        'Lacerate'
    ],
    'longsword': [
        'Lacerate',
        'Pommel Strike',
        'Rush Attack'
    ],
    'handcrossbow': [
        'Mobile Shot',
        'Piercing Shot'
    ],
    'warpick': [
        'Maiming Strike',
        'Weakening Strike'
    ],
    'trident': [
        'Maiming Strike',
        'Piercing Strike',
        'Rush Attack'
    ],
    'lightcrossbow': [
        'Piercing Shot'
    ],
    'heavycrossbow': [
        'Piercing Shot'
    ],
    'spear': [
        'Rush Attack'
    ],
    'quarterstaff': [
        'Topple'
    ],
    'sickle': [
        'Lacerate'
    ]
};
let simpleWeapons = [
    'club',
    'dagger',
    'greatclub',
    'handaxe',
    'javelin',
    'lightcrossbow',
    'lighthammer',
    'mace',
    'quarterstaff',
    'shortbow',
    'sickle',
    'sling',
    'spear'
];
let martialWeapons = [
    'battleaxe',
    'blowgun',
    'flail',
    'glaive',
    'greataxe',
    'greatsword',
    'halberd',
    'handcrossbow',
    'heavycrossbow',
    'lance',
    'longbow',
    'longsword',
    'maul',
    'morningstar',
    'net',
    'pike',
    'rapier',
    'scimitar',
    'shortsword',
    'trident',
    'warpick',
    'warhammer',
    'whip'
];
async function addFeatures(item, updates, options, id) {
    if (item.type != 'weapon') return;
    let actor = item.actor;
    if (!actor) return;
    let proficient = item.system.proficient;
    let baseItem = item.system.baseItem;
    if (!baseItem) return;
    if (!proficient && isNewerVersion(game.version, '11.293')) {
        proficient = item.actor.system.traits.weaponProf.value.has(baseItem);
        if (simpleWeapons.includes(baseItem) && item.actor.system.traits.weaponProf.value.has('sim')) proficient = true;
        if (martialWeapons.includes(baseItem) && item.actor.system.traits.weaponProf.value.has('mar')) proficient = true;
    }
    if (!proficient) return;
    let currentlyEquipped = updates.system?.equipped ?? item.system.equipped;
    let previouslyEquipped = item.system?.equipped;
    if (currentlyEquipped === previouslyEquipped) return;
    if (!currentlyEquipped) {
        await removeFeatures(item);
        return;
    }
    if (!weapons[baseItem]) return;
    let items = [];
    for (let i of weapons[baseItem]) {
        if (chris.getItem(actor, i)) continue;
        let featureData = await chris.getItemFromCompendium('chris-premades.CPR Homebrew Feature Items', i, false);
        if (!featureData) continue;
        featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', i);
        featureData.system.uses.value = getProperty(actor, 'flags.chris-premades.homebrew.bg3.' + i) ?? 1;
        items.push(featureData);
    }
    if (item.length === 0) return;
    await actor.createEmbeddedDocuments('Item', items);
}
async function removeFeatures(item, options, id) {
    if (item.type != 'weapon') return;
    let actor = item.actor;
    if (!actor) return;
    let baseItem = item.system.baseItem;
    if (!weapons[baseItem]) return;
    let otherItems = actor.items.filter(i => i.system.baseItem === baseItem && i.system.equipped);
    if (otherItems.length > 1) return;
    let items = [];
    let updates = {};
    for (let i of weapons[baseItem]) {
        let feature = chris.getItem(actor, i);
        if (!feature) continue;
        items.push(feature.id);
        setProperty(updates, 'flags.chris-premades.homebrew.bg3.' + i, feature.system.uses.value);
    }
    if (!items.length) return;
    await actor.deleteEmbeddedDocuments('Item', items);
    await actor.update(updates);
}
async function rest(actor, data) {
    let updates = {
        'flags': {
            'chris-premades': {
                'homebrew': {
                    'bg3': {
                        'Backbreaker': 1,
                        'Brace': 1,
                        'Cleave': 1,
                        'Concussive Smash': 1,
                        'Flourish': 1,
                        'Hamstring Shot': 1,
                        'Heartstopper': 1,
                        'Lacerate': 1,
                        'Maiming Strike': 1,
                        'Mobile Shot': 1,
                        'Piercing Strike': 1,
                        'Piercing Shot': 1,
                        'Pommel Strike': 1,
                        'Prepare': 1,
                        'Rush Attack': 1,
                        'Tenacity': 1,
                        'Topple': 1,
                        'Weakening Strike': 1
                    }
                }
            }
        }
    };
    await actor.update(updates);
}
let effects = [
    'Crippled',
    'Off Balance',
    'Hamstrung',
    'Bleeding',
    'Gaping Wounds',
];
async function healing(workflow) {
    if (!workflow.targets.size) return;
    if (workflow.defaultDamageType != 'healing') return;
    for (let i of Array.from(workflow.targets)) {
        for (let j of effects) {
            let effect = chris.findEffect(i.actor, j);
            if (effect) await chris.removeEffect(effect);
        }
    }
}
export let bg3 = {
    'backbreaker': backbreaker,
    'brace': brace,
    'cleave': cleave,
    'concussiveSmash': concussiveSmash,
    'maimingStrike': maimingStrike,
    'flourish': flourish,
    'heartstopper': heartstopper,
    'lacerate': lacerate,
    'piercingStrike': piercingStrike,
    'pommelStrike': pommelStrike,
    'prepare': prepare,
    'rushAttack': rushAttack,
    'tenacity': tenacity,
    'topple': topple,
    'weakeningStrike': weakeningStrike,
    'hamstringShot': hamstringShot,
    'mobileShot': mobileShot,
    'removeFeatures': removeFeatures,
    'addFeatures': addFeatures,
    'rest': rest,
    'healing': healing
}