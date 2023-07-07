import {chris} from '../helperFunctions.js';
export let allRaces = {
    'aarakocra': 
    {
        'name': 'Aarakocra',
        'weight': 5,
        'enabled': true
    },
    'aasimar': 
    {
        'name': 'Aasimar',
        'weight': 5,
        'enabled': true
    },
    'air-genasi': 
    {
        'name': 'Air Genasi',
        'weight': 25,
        'enabled': true
    },
    'astral-elf': 
    {
        'name': 'Astral Elf',
        'weight': 5,
        'enabled': false
    },
    'autognome': 
    {
        'name': 'Autognome',
        'weight': 5,
        'enabled': false
    },
    'bugbear': 
    {
        'name': 'Bugbear',
        'weight': 25,
        'enabled': true
    },
    'centaur': 
    {
        'name': 'Centaur',
        'weight': 25,
        'enabled': true
    },
    'changeling': 
    {
        'name': 'Changeling',
        'weight': 5,
        'enabled': true
    },
    'deep-gnome': 
    {
        'name': 'Deep Gnome',
        'weight': 25,
        'enabled': true
    },
    'dhampir': 
    {
        'name': 'Dhampir',
        'weight': 5,
        'enabled': false
    },
    'chromatic-dragonborn': 
    {
        'name': 'Chromatic Dragonborn',
        'weight': 50,
        'enabled': true
    },
    'draconblood-dragonborn':
    {
        'name': 'Draconblood Dragonborn',
        'weight': 50,
        'enabled': false
    },
    'gem-dragonborn':
    {
        'name': 'Gem Dragonborn',
        'weight': 10,
        'enabled': false
    },
    'metallic-dragonborn':
    {
        'name': 'Metallic Dragonborn',
        'weight': 25,
        'enabled': false
    },
    'ravenite-dragonborn':
    {
        'name': 'Ravenite Dragonborn',
        'weight': 50,
        'enabled': false
    },
    'duergar':
    {
        'name': 'Duergar',
        'weight': 50,
        'enabled': true
    },
    'hill-dwarf':
    {
        'name': 'Hill Dwarf',
        'weight': 50,
        'enabled': true
    },
    'mountain-dwarf':
    {
        'name': 'Mountain Dwarf',
        'weight': 50,
        'enabled': true
    },
    'mark-of-warding-dwarf':
    {
        'name': 'Mark of Warding Dwarf',
        'weight': 25,
        'enabled': false
    },
    'earth-genasi':
    {
        'name': 'Earth Genasi',
        'weight': 25,
        'enabled': true
    },
    'autumn-eladrin':
    {
        'name': 'Autumn Eladrin',
        'weight': 10,
        'enabled': true
    },
    'winter-eladrin':
    {
        'name': 'Winter Eladrin',
        'weight': 10,
        'enabled': true
    },
    'spring-eladrin':
    {
        'name': 'Spring Eladrin',
        'weight': 10,
        'enabled': true
    },
    'summer-eladrin':
    {
        'name': 'Summer Eladrin',
        'weight': 10,
        'enabled': true
    },
    'aereni-high-elf':
    {
        'name': 'Aereni High Elf',
        'weight': 25,
        'enabled': false
    },
    'aereni-wood-elf':
    {
        'name': 'Aereni Wood Elf',
        'weight': 25,
        'enabled': false
    },
    'drow':
    {
        'name': 'Drow',
        'weight': 25,
        'enabled': true
    },
    'high-elf':
    {
        'name': 'High Elf',
        'weight': 50,
        'enabled': true
    },
    'mark-of-shadow-elf':
    {
        'name': 'Mark of Shadow Elf',
        'weight': 25,
        'enabled': false
    },
    'pallid-elf':
    {
        'name': 'Pallid Elf',
        'weight': 5,
        'enabled': false
    },
    'valenar-high-elf':
    {
        'name': 'Valenar High Elf',
        'weight': 25,
        'enabled': false
    },
    'valenar-wood-elf':
    {
        'name': 'Valenar Wood Elf',
        'weight': 25,
        'enabled': false
    },
    'wood-elf':
    {
        'name': 'Wood Elf',
        'weight': 50,
        'enabled': true
    },
    'fairy':
    {
        'name': 'Fairy',
        'weight': 5,
        'enabled': true
    },
    'firbolg':
    {
        'name': 'Firbolg',
        'weight': 25,
        'enabled': true
    },
    'fire-genasi':
    {
        'name': 'Fire Genasi',
        'weight': 25,
        'enabled': true
    },
    'giff':
    {
        'name': 'Giff',
        'weight': 5,
        'enabled': false
    },
    'githyanki':
    {
        'name': 'Githyanki',
        'weight': 10,
        'enabled': true
    },
    'githzerai':
    {
        'name': 'Githzerai',
        'weight': 10,
        'enabled': true
    },
    'forest-gnome':
    {
        'name': 'Forest Gnome',
        'weight': 50,
        'enabled': true
    },
    'mark-of-scribing-gnome':
    {
        'name': 'Mark of Scribing Gnome',
        'weight': 25,
        'enabled': false
    },
    'rock-gnome':
    {
        'name': 'Rock Gnome',
        'weight': 50,
        'enabled': true
    },
    'goblin':
    {
        'name': 'Goblin',
        'weight': 5,
        'enabled': true
    },
    'goliath':
    {
        'name': 'Goliath',
        'weight': 10,
        'enabled': true
    },
    'grung':
    {
        'name': 'Grung',
        'weight': 5,
        'enabled': false
    },
    'hadozee':
    {
        'name': 'Hadozee',
        'weight': 5,
        'enabled': false
    },
    'aquatic-half-elf':
    {
        'name': 'Aquatic Half-Elf',
        'weight': 5,
        'enabled': true
    },
    'drow-half-elf':
    {
        'name': 'Drow Half-Elf',
        'weight': 10,
        'enabled': true
    },
    'high-half-elf':
    {
        'name': 'High Half-Elf',
        'weight': 50,
        'enabled': true
    },
    'mark-of-detection-half-elf':
    {
        'name': 'Mark of Detection Half-Elf',
        'weight': 25,
        'enabled': false
    },
    'mark-of-storm-half-elf':
    {
        'name': 'Mark of Storm Half-Elf',
        'weight': 25,
        'enabled': false
    },
    'wood-half-elf':
    {
        'name': 'Wood Half-Elf',
        'weight': 50,
        'enabled': true
    },
    'half-orc':
    {
        'name': 'Half-Orc',
        'weight': 10,
        'enabled': true
    },
    'mark-of-finding-half-orc':
    {
        'name': 'Mark of Finding Half-Orc',
        'weight': 25,
        'enabled': false
    },
    'ghostwise-halfling':
    {
        'name': 'Ghostwise Halfling',
        'weight': 10,
        'enabled': false
    },
    'lightfoot-halfling':
    {
        'name': 'Lightfoot Halfling',
        'weight': 50,
        'enabled': true
    },
    'lotusden-halfling':
    {
        'name': 'Lotusden Halfling',
        'weight': 25,
        'enabled': false
    },
    'mark-of-healing-halfling':
    {
        'name': 'Mark of Healing Halfling',
        'weight': 25,
        'enabled': false
    },
    'mark-of-hospitality-halfling':
    {
        'name': 'Mark of Hospitality Halfling',
        'weight': 25,
        'enabled': false
    },
    'stout-halfling':
    {
        'name': 'Stout Halfling',
        'weight': 50,
        'enabled': true
    },
    'harengon':
    {
        'name': 'Harengon',
        'weight': 10,
        'enabled': false
    },
    'hexblood':
    {
        'name': 'Hexblood',
        'weight': 5,
        'enabled': false
    },
    'hobgoblin':
    {
        'name': 'Hobgoblin',
        'weight': 10,
        'enabled': true
    },
    'human':
    {
        'name': 'Human',
        'weight': 100,
        'enabled': true
    },
    'mark-of-finding-human':
    {
        'name': 'Mark of Finding Human',
        'weight': 25,
        'enabled': false
    },
    'mark-of-handling-human':
    {
        'name': 'Mark of Handling Human',
        'weight': 25,
        'enabled': false
    },
    'mark-of-making-human':
    {
        'name': 'Mark of Making Human',
        'weight': 25,
        'enabled': false
    },
    'mark-of-passage-human':
    {
        'name': 'Mark of Passage Human',
        'weight': 25,
        'enabled': false
    },
    'kalashtar':
    {
        'name': 'Kalashtar',
        'weight': 25,
        'enabled': false
    },
    'kender':
    {
        'name': 'Kender',
        'weight': 25,
        'enabled': false
    },
    'kenku':
    {
        'name': 'Kenku',
        'weight': 5,
        'enabled': true
    },
    'kobold':
    {
        'name': 'Kobold',
        'weight': 5,
        'enabled': true
    },
    'leonin':
    {
        'name': 'Leonin',
        'weight': 10,
        'enabled': false
    },
    'lizardfolk':
    {
        'name': 'Lizardfolk',
        'weight': 5,
        'enabled': true
    },
    'locathah':
    {
        'name': 'Locathah',
        'weight': 5,
        'enabled': false
    },
    'loxodon':
    {
        'name': 'Loxodon',
        'weight': 25,
        'enabled': false
    },
    'minotaur':
    {
        'name': 'Minotaur',
        'weight': 5,
        'enabled': true
    },
    'orc':
    {
        'name': 'Orc',
        'weight': 5,
        'enabled': true
    },
    'owlin':
    {
        'name': 'Owlin',
        'weight': 10,
        'enabled': false
    },
    'plasmoid':
    {
        'name': 'Plasmoid',
        'weight': 5,
        'enabled': false
    },
    'reborn':
    {
        'name': 'Reborn',
        'weight': 5,
        'enabled': false
    },
    'satyr':
    {
        'name': 'Satyr',
        'weight': 5,
        'enabled': true
    },
    'sea-elf':
    {
        'name': 'Sea Elf',
        'weight': 10,
        'enabled': true
    },
    'shadar-kai':
    {
        'name': 'Shadar-Kai',
        'weight': 5,
        'enabled': true
    },
    'beasthide-shifter':
    {
        'name': 'Beasthide Shifter',
        'weight': 5,
        'enabled': true
    },
    'longtooth-shifter':
    {
        'name': 'Longtooth Shifter',
        'weight': 5,
        'enabled': true
    },
    'swiftstride-shifter':
    {
        'name': 'Swiftstride Shifter',
        'weight': 5,
        'enabled': true
    },
    'wildhunt-shifter':
    {
        'name': 'Wildhunt Shifter',
        'weight': 5,
        'enabled': true
    },
    'simic-hybrid':
    {
        'name': 'Simic Hybrid',
        'weight': 25,
        'enabled': false
    },
    'tabaxi':
    {
        'name': 'Tabaxi',
        'weight': 10,
        'enabled': true
    },
    'thri-kreen':
    {
        'name': 'Thri-Kreen',
        'weight': 5,
        'enabled': false
    },
    'baalzebul-tiefling':
    {
        'name': 'Baalzebul Tiefling',
        'weight': 1,
        'enabled': true
    },
    'dispater-tiefling':
    {
        'name': 'Dispater Tiefling',
        'weight': 1,
        'enabled': true
    },
    'tierna-tiefling':
    {
        'name': 'Tierna Tiefling',
        'weight': 1,
        'enabled': true
    },
    'glasya-tiefling':
    {
        'name': 'Glasya Tiefling',
        'weight': 1,
        'enabled': true
    },
    'levistus-tiefling':
    {
        'name': 'Levistus Tiefling',
        'weight': 1,
        'enabled': true
    },
    'mammon-tiefling':
    {
        'name': 'Mammon Tiefling',
        'weight': 1,
        'enabled': true
    },
    'mephistopheles-tiefling':
    {
        'name': 'Mephistopheles Tiefling',
        'weight': 1,
        'enabled': true
    },
    'zariel-tiefling':
    {
        'name': 'Zariel Tiefling',
        'weight': 1,
        'enabled': true
    },
    'hellfire-tiefling':
    {
        'name': 'Hellfire Tiefling',
        'weight': 1,
        'enabled': true
    },
    'winged-tiefling':
    {
        'name': 'Winged Tiefling',
        'weight': 1,
        'enabled': true
    },
    'feral-winged-tiefling':
    {
        'name': 'Feral Winged Tiefling',
        'weight': 1,
        'enabled': false
    },
    'feral-hellfire-tiefling':
    {
        'name': 'Feral Hellfire Tiefling',
        'weight': 1,
        'enabled': false
    },
    'tortle':
    {
        'name': 'Tortle',
        'weight': 5,
        'enabled': true
    },
    'triton':
    {
        'name': 'Triton',
        'weight': 5,
        'enabled': true
    },
    'vedalken':
    {
        'name': 'Vedalken',
        'weight': 25,
        'enabled': false
    },
    'verdan':
    {
        'name': 'Verdan',
        'weight': 5,
        'enabled': false
    },
    'water-genasi':
    {
        'name': 'Water Genasi',
        'weight': 25,
        'enabled': false
    },
    'warforged':
    {
        'name': 'Warforged',
        'weight': 25,
        'enabled': false
    },
    'yaun-ti':
    {
        'name': 'Yaun-Ti',
        'weight': 5,
        'enabled': true
    }
};
let chanceTable = [];
let chanceTotal;
export function updateChanceTable () {
    chanceTotal = 0;
    for (let [key, value] of Object.entries(game.settings.get('chris-premades', 'Humanoid Randomizer Settings'))) {
        if (!value.enabled) continue;
        chanceTable.push([key, value.weight]);
        chanceTotal += value.weight;
    }
}
function pickRace() {
    if (chanceTable.length === 0) updateChanceTable();
    let threshold = Math.random() * chanceTotal;
    let total = 0;
    for (let i = 0; i < chanceTotal - 1; ++i) {
        total += chanceTable[i][1];
        if (total >= threshold) {
            return chanceTable[i][0];
        }
    }
    return chanceTable[chanceTotal - 1][0];
}
export async function npcRandomizer(token, options, user) {
    if ((game.user.id !== user) || token.actorLink) return;
    let item = token.actor.items.getName('CPR - Randomizer');
    if (!item) return;
    let actor = token.actor;
    let updates = {};
    if (chris.getConfiguration(item, 'humanoid')) await humanoid(actor, updates, item) ?? false;
    console.log(updates);
}
async function humanoid(targetActor, updates, item) {
//    let race = pickRace();
    let race = 'aarakocra';
    console.log(race);
    let sourceActor;
    switch(race) {
        case 'aarakocra':
            sourceActor = await chris.getItemFromCompendium(game.settings.get('chris-premades', 'Monster Compendium'), 'Aarakocra', false);
    }
    if (!sourceActor) return;
    let abilities = chris.getConfiguration(item, 'abilities') ?? 'upgrade';
    for (let i of Object.keys(CONFIG.DND5E.abilities)) {
        let sourceAbility = sourceActor.system.abilities[i].value;
        let targetAbility = targetActor.system.abilities[i].value;
        switch (abilities) {
            case 'source':
                setProperty(updates, 'actor.system.abilities.' + i + '.value', sourceAbility);
                break;
            case 'upgrade':
                if (sourceAbility > targetAbility) setProperty(updates, 'actor.system.abilities.' + i + '.value', sourceAbility);
                break;
            case 'downgrade':
                if (sourceAbility < targetAbility) setProperty(updates, 'actor.system.abilities.' + i + '.value', sourceAbility);
                break;
        }
    }
    let skills = chris.getConfiguration(item, 'skills') ?? 'upgrade';
    for (let i of Object.keys(CONFIG.DND5E.skills)) {
        let sourceSkill = sourceActor.system.skills[i].value;
        let targetSkill = targetActor.system.skills[i].value;
        switch (skills) {
            case 'source':
                setProperty(updates, 'actor.system.skills.' + i + '.value', sourceSkill);
                break;
            case 'upgrade':
                if (sourceSkill > targetSkill) setProperty(updates, 'actor.system.skills.' + i + '.value', sourceSkill);
                break;
            case 'downgrade':
                if (sourceSkill < targetSkill) setProperty(updates, 'actor.system.skills.' + i + '.value', sourceSkill);
                break;
        }
    }
    let avatar = chris.getConfiguration(item, 'avatar') ?? 'source';
    if (avatar === 'source') setProperty(updates, 'actor.img', sourceActor.img);
    let token = chris.getConfiguration(item, 'token') ?? 'source';
    if (token === 'source') {
        setProperty(updates, 'actor.prototypeToken.texture.src', sourceActor.prototypeToken.texture.src);
        setProperty(updates, 'token.texture.src', sourceActor.prototypeToken.texture.src);
    }
}