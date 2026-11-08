import {activityUtils, actorUtils, automationUtils, documentUtils, genericUtils, itemUtils, rollUtils, summonUtils} from '../../../proxy.mjs';
const srdPacks = {2014: 'Compendium.dnd5e.monsters.Actor.', 2024: 'Compendium.dnd5e.actors24.Actor.'};
const defaultCards = {
    2014: [
        ['Ace of Hearts', 'ZyIBOoZZD0nDaO2s'],
        ['King of Hearts', 'D5UqYD1EnTrJaMTO'],
        ['King of Hearts', 'E9CvDPDg5dFEpVjS', 4],
        ['Queen of Hearts', 'VmdyZDjqAc8vdncY'],
        ['Jack of Hearts', 'K15Yl8JmB5iPircc'],
        ['Ten of Hearts', 'Aw2wmqGIatxe2ImI'],
        ['Nine of Hearts', 'KLCkHep28HBfdsky'],
        ['Eight of Hearts', 'QtJairF0h18BRhEM'],
        ['Two of Hearts', 'TjWQOgI3A4UAl7lC'],
        ['Ace of Diamonds', '', 1, 'Beholder'],
        ['King of Diamonds', 'B7lBOr1AahNZs4a6'],
        ['King of Diamonds', '', 1, 'Apprentice Wizard'],
        ['Queen of Diamonds', 'xvh2UOKv1bh03Gih'],
        ['Jack of Diamonds', 'EMvcuOpu7ABCmBWi'],
        ['Ten of Diamonds', '45Z5kogZEhawX1Ey'],
        ['Nine of Diamonds', 'L1w8yBkInMscfJ3F'],
        ['Eight of Diamonds', 'R2GPY9BhRmmwZwkh'],
        ['Two of Diamonds', '5ngbctIMeEnuC1p1'],
        ['Ace of Spades', 'bfh29vIEoGzI240e'],
        ['King of Spades', 'PVD5wRdyO7iCJPs1'],
        ['King of Spades', 'CHEUjiYrVM9X0vIT', 2],
        ['Queen of Spades', 'eiifqZwYGi71r2Yl'],
        ['Jack of Spades', 'J8xjoG4Dxb8WkHtV'],
        ['Ten of Spades', 'Buxe6dDK5Mw7kxe6'],
        ['Nine of Spades', 'ZHAFrnCwCz17dmLc'],
        ['Eight of Spades', '6qnT52lZtZblgGw8'],
        ['Two of Spades', 'TjWQOgI3A4UAl7lC'],
        ['Ace of Clubs', 'h98AuPfomEPcCibP'],
        ['King of Clubs', 'rb7OJt822wIO52qY'],
        ['King of Clubs', 'n4TEv7inVUkyZviN', 3],
        ['Queen of Clubs', '3o2rQBqpzjIHmrBW'],
        ['Jack of Clubs', 'kz1t6xeXVwODpYb2'],
        ['Ten of Clubs', '9g4N9sjyh8Ql46to'],
        ['Nine of Clubs', 'eIGowKTkEBC9gUzx'],
        ['Eight of Clubs', 'HB49mCOVBXwWeKWQ'],
        ['Two of Clubs', '5ngbctIMeEnuC1p1']
    ],
    2024: [
        ['Adult Red Dragon', 'mmAdultRedDragon'],
        ['Archmage', 'mmArchmage000000'],
        ['Assassin', 'mmAssassin000000'],
        ['Bandit Captain', 'mmBanditCaptain0'],
        ['Beholder', ''],
        ['Berserker', 'mmBerserker00000'],
        ['Bugbear Warrior', 'mmBugbearWarrior'],
        ['Cloud Giant', 'mmCloudGiant0000'],
        ['Druid', 'mmDruid000000000'],
        ['Erinyes', 'mmErinyes0000000'],
        ['Ettin', 'mmEttin000000000'],
        ['Fire Giant', 'mmFireGiant00000'],
        ['Frost Giant', 'mmFrostGiant0000'],
        ['Gnoll Warrior', 'mmGnollWarrior00'],
        ['Goblin Warrior', 'mmGoblinWarrior0'],
        ['Guardian Naga', 'mmGuardianNaga00'],
        ['Hill Giant', 'mmHillGiant00000'],
        ['Hobgoblin Warrior', 'mmHobgoblinWarri'],
        ['Incubus', 'mmIncubus0000000'],
        ['Iron Golem', 'mmIronGolem00000'],
        ['Knight', 'mmKnight00000000'],
        ['Kobold Warrior', 'mmKoboldWarrior0'],
        ['Lich', 'mmLich0000000000'],
        ['Medusa', 'mmMedusa00000000'],
        ['Night Hag', 'mmNightHag000000'],
        ['Ogre', 'mmOgre0000000000'],
        ['Oni', 'mmOni00000000000'],
        ['Priest', 'mmPriest00000000'],
        ['Succubus', 'mmSuccubus000000'],
        ['Troll', 'mmTroll000000000'],
        ['Warrior Veteran', 'mmWarriorVeteran'],
        ['Wyvern', 'mmWyvern00000000']
    ]
};
const commoner = {2014: 'SqZRuJ8lt2KGJBbq', 2024: 'mmCommoner000000'};
async function resolveCards({document: item}) {
    const rows = genericUtils.duplicate(automationUtils.getConfigValue(item, 'cards') ?? []);
    let changed = false;
    for (const row of rows) {
        const linked = row.uuid ? await fromUuid(row.uuid) : null;
        if (linked && !linked.pack?.startsWith('dnd5e.')) continue;
        const found = await automationUtils.getCompendiumDocumentByName(linked?.name ?? row.name ?? row.label, 'monster', {rules: linked?.system.source?.rules});
        if (!found || found.uuid === row.uuid) continue;
        row.uuid = found.uuid;
        changed = true;
    }
    if (changed) await automationUtils.setConfigValue(item, 'cards', rows);
}
function drawerLabel(index) {
    return _loc('CHRISPREMADES.Macros.All.DeckOfIllusions.Drawer', {index});
}
function drawerUpdates(actor, token) {
    return {
        name: actor.name,
        img: actor.img,
        prototypeToken: {
            name: token?.name ?? actor.prototypeToken.name,
            texture: genericUtils.duplicate((token ?? actor.prototypeToken).texture),
            width: (token ?? actor.prototypeToken).width,
            height: (token ?? actor.prototypeToken).height
        }
    };
}
function deckCards(item) {
    const rows = (automationUtils.getConfigValue(item, 'cards') ?? []).filter(row => row.label);
    const cards = Map.groupBy(rows, row => row.label);
    const drawers = Number(automationUtils.getConfigValue(item, 'drawerCards')) || 0;
    for (let i = 1; i <= drawers; i++) cards.set(drawerLabel(i), null);
    return cards;
}
async function draw({document: item, macroClass: {identifier, source}, workflow}) {
    if (workflow.activity.identifier !== 'draw') return;
    const rules = documentUtils.getRules(item);
    const drawn = item.flags[source]?.[identifier]?.drawn ?? [];
    const cards = deckCards(item);
    const remaining = [...cards.keys()].filter(label => !drawn.includes(label));
    if (!remaining.length) return genericUtils.notify('CHRISPREMADES.Macros.All.DeckOfIllusions.Empty', {type: 'warn'});
    const {roll} = await rollUtils.rollDice('1d' + remaining.length, {document: workflow.actor, message: true, flavor: item.name});
    const card = remaining[roll.total - 1];
    const token = workflow.token?.document ?? actorUtils.getFirstToken(workflow.actor);
    const rows = cards.get(card) ?? [{uuid: srdPacks[rules] + commoner[rules], count: 1, isDrawer: true}];
    const summons = [];
    for (const row of rows) {
        const creature = row.uuid ? await fromUuid(row.uuid) : null;
        if (!creature) {
            genericUtils.notify('CHRISPREMADES.Macros.All.DeckOfIllusions.Missing', {type: 'warn', format: {name: card}});
            continue;
        }
        const options = row.isDrawer ? {name: workflow.actor.name, updates: drawerUpdates(workflow.actor, token)} : {name: creature.name};
        for (let i = 0; i < (Number(row.count) || 1); i++) summons.push(await summonUtils.createSummon(workflow.actor, creature, {...options, sourceDocument: item, disposition: token?.disposition}));
    }
    if (!summons.length) return;
    await documentUtils.setFlag(item, source, identifier, {drawn: [...drawn, card]});
    await itemUtils.unhideActivities(item, ['move'], {favorite: true});
    if (token) await summonUtils.placeSummons(summons.filter(Boolean), (activityUtils.getRange(workflow.activity) || 30), {token});
}
async function move({document: item, workflow}) {
    if (workflow.activity.identifier !== 'move') return;
    for (const summon of summonUtils.getSummonsBySource(item).filter(summon => summon.token)) await summon.move(30);
}
async function dispelled({document: item, summon}) {
    if (summonUtils.getSummonsBySource(item).some(other => other !== summon)) return;
    await itemUtils.rehideActivities(item, ['move'], {favorite: true});
}
function deck(rules) {
    return {
        name: 'Deck of Illusions',
        version: '2.1.8',
        rules,
        roll: [
            {
                pass: 'itemRollFinished',
                macro: draw,
                priority: 50
            },
            {
                pass: 'itemRollFinished',
                macro: move,
                priority: 50
            }
        ],
        item: [
            {
                pass: 'created',
                macro: resolveCards,
                priority: 50
            },
            {
                pass: 'medkit',
                macro: resolveCards,
                priority: 50
            },
            {
                pass: 'munched',
                macro: resolveCards,
                priority: 50
            }
        ],
        summon: [
            {
                pass: 'delete',
                macro: dispelled,
                priority: 50
            }
        ],
        config: {
            cards: {
                default: defaultCards[rules].map(([label, id, count = 1, name]) => ({label, uuid: id && srdPacks[rules] + id, count, name})),
                type: 'documentMap',
                documentType: 'Actor',
                count: true,
                label: 'CHRISPREMADES.Macros.All.DeckOfIllusions.Cards',
                hint: 'CHRISPREMADES.Macros.All.DeckOfIllusions.CardsHint',
                category: 'mechanics'
            },
            drawerCards: {
                default: 2,
                type: 'number',
                label: 'CHRISPREMADES.Macros.All.DeckOfIllusions.DrawerCards',
                category: 'mechanics'
            }
        }
    };
}
export const deckOfIllusions2014 = deck('2014');
export const deckOfIllusions2024 = deck('2024');
