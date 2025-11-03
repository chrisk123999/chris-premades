import {Summons} from '../../../../lib/summons.js';
import {compendiumUtils, constants, genericUtils, itemUtils} from '../../../../utils.js';
let monsters = [
    'Adult Red Dragon',
    'Archmage',
    'Assasin',
    'Bandit Captain',
    'Beholder',
    'Berserker',
    'Bugbear Warrior',
    'Cloud Giant',
    'Druid',
    'Erinyes',
    'Ettin',
    'Fire Giant',
    'Frost Giant',
    'Gnoll Warrior',
    'Goblin Warrior',
    'Guardian Naga',
    'Hill Giant',
    'Hobgoblin Warrior',
    'Incubus',
    'Iron Golem',
    'Knight',
    'Kobold Warrior',
    'Lich',
    'Medusa',
    'Night Hag',
    'Ogre',
    'Oni',
    'Priest',
    'Succubus',
    'Troll',
    'Warrior Veteran',
    'Wyvern',
    'The Card Drawer (1)',
    'The Card Drawer (2)'
];
async function roll({trigger, workflow}) {
    if (!itemUtils.getEquipmentState(workflow.item)) return;
    let cardsAvailable = itemUtils.getConfig(workflow.item, 'cardsAvailable');
    if (!cardsAvailable.length) return;
    let total = workflow.utilityRolls[0].total;
    function pickMonster(total) {
        if (total <= 96) {
            let index = Math.floor((total - 1) / 3);
            return monsters[index].slugify();
        } else {
            return cardsAvailable.includes(monsters[32].slugify()) ? monsters[32].slugify() : cardsAvailable.includes(monsters[33].slugify()) ? monsters[33].slugify() : monsters[32].slugify();
        }
    }
    let monster = pickMonster(total);
    let safety = 0;
    let newRoll;
    while (!cardsAvailable.includes(monster) && safety < 200) {
        newRoll = await workflow.utilityRolls[0].reroll();
        monster = pickMonster(newRoll.total);
        safety++;
        if (safety >= 200) {
            genericUtils.notify('CHRISPREMADES.DeckOfIllusions.UnableToPickACard', 'warn', {localize: true});
            return;
        }
    }
    if (newRoll) await workflow.setUtilityRolls([newRoll]);
    genericUtils.setProperty(workflow, 'chris-premades.deckOfIllusions.selected', monster);
}
async function use({trigger, workflow}) {
    if (!itemUtils.getEquipmentState(workflow.item)) return;
    if (!workflow.token) return;
    let monster = workflow['chris-premades']?.deckOfIllusions.selected;
    if (!monster) return;
    let cardsAvailable = itemUtils.getConfig(workflow.item, 'cardsAvailable').filter(i => i != monster);
    await itemUtils.setConfig(workflow.item, 'cardsAvailable', cardsAvailable);
    let monsterName;
    if (monster === monsters[32].slugify() || monster === monsters[33].slugify()) {
        monsterName = 'Commoner';
    } else {
        monsterName = monsters.find(i => i.slugify() === monster);
    }
    let monsterPack = genericUtils.getCPRSetting('monsterCompendium');
    if (!game.packs.get(monsterPack)) return;
    let actor = await compendiumUtils.getActorFromCompendium(monsterPack, monsterName);
    if (!actor) return;
    let updates = {};
    if (monsterName === 'Commoner') {
        updates = {
            actor: {
                name: workflow.actor.name,
                img: workflow.actor.img,
                prototypeToken: {
                    name: workflow.actor.prototypeToken.name,
                    texture: {
                        src: workflow.actor.prototypeToken.texture.src,
                        scaleX: workflow.actor.prototypeToken.texture.scaleX,
                        scaleY: workflow.actor.prototypeToken.texture.scaleY
                    },
                    disposition: workflow.actor.prototypeToken.disposition
                },
                flags: {
                    'midi-qol': {
                        neverTarget: true
                    }
                }
            },
            token: {
                name: workflow.token.document.name,
                texture: {
                    src: workflow.token.document.texture.src,
                    scaleX: workflow.token.document.texture.scaleX,
                    scaleY: workflow.token.document.texture.scaleY
                },
                disposition: workflow.token.document.disposition
            }
        };
    }
    let animation = itemUtils.getConfig(workflow.item, 'animation');
    await Summons.spawn(actor, updates, workflow.item, workflow.token, {
        range: workflow.activity.range.value,
        animation,
        unhideActivities: [
            {
                itemUuid: workflow.item.uuid,
                activityIdentifiers: ['move'],
                favorite: true
            }
        ]
    });
}
export let deckOfIllusions = {
    name: 'Deck of Illusions',
    version: '1.3.118',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'utilityRollComplete',
                macro: roll,
                priority: 50,
                activities: ['use']
            },
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['use']
            }
        ]
    },
    config: [
        {
            value: 'cardsAvailable',
            label: 'CHRISPREMADES.DeckOfIllusions.CardsAvailable',
            type: 'select-many',
            options: monsters.map(i => ({value: i.slugify(), label: i})),
            default: monsters.map(i => i.slugify()),
            category: 'mechanics',
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'default',
            category: 'animation',
            options: constants.summonAnimationOptions
        }
    ]
};