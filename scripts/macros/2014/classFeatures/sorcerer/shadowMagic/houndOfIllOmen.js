import {Summons} from '../../../../../lib/summons.js';
import {animationUtils, compendiumUtils, constants, effectUtils, genericUtils, itemUtils, tokenUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let monsterName = itemUtils.getConfig(workflow.item, 'monsterName');
    let monsterCompendium = genericUtils.getCPRSetting('monsterCompendium');
    let monster = await compendiumUtils.getActorFromCompendium(monsterCompendium, monsterName, {ignoreNotFound: true}) ?? game.actors.getName(monsterName);
    if (!monster) return;
    let classIdentifier = itemUtils.getConfig(workflow.item, 'classIdentifier');
    if (!workflow.actor.classes[classIdentifier]) return;
    let updates = {
        token: {
            name: workflow.item.name,
            width: 1,
            height: 1,
            disposition: workflow.token.document.disposition
        },
        actor: {
            name: workflow.item.name,
            prototypeToken: {
                name: workflow.item.name,
                width: 1,
                height: 1,
                disposition: workflow.token.document.disposition
            },
            system: {
                details: {
                    type: {
                        value: 'monstrosity'
                    }
                },
                attributes: {
                    hp: {
                        temp: Math.floor(workflow.actor.classes[classIdentifier].system.levels / 2)
                    }
                },
                traits: {
                    size: 'med'
                }
            }
        }
    };
    let animation = itemUtils.getConfig(workflow.item, 'animation');
    if (animationUtils.jb2aCheck() != 'patreon') animation = 'none';
    await Summons.spawn(monster, updates, workflow.item, workflow.token, {
        duration: itemUtils.convertDuration(workflow.activity).seconds,
        range: workflow.activity.range.value,
        animation
    });
    let spawnEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'houndOfIllOmen');
    if (!spawnEffect) return;
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    await effectUtils.createEffect(workflow.targets.first().actor, effectData, {parentEntity: spawnEffect, interdependent: true});
}
async function early({trigger: {entity: item}, workflow}) {
    let houndEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'houndOfIllOmen');
    if (!houndEffect) return;
    if (workflow.item.type != 'spell') return;
    if (!workflow.targets.size) return;
    let hound = workflow.token.document.parent.tokens.get(houndEffect.flags['chris-premades'].summons.ids[item.name][0]);
    if (!hound) return;
    await Promise.all(workflow.targets.map(async token => {
        let effect = effectUtils.getEffectByIdentifier(token.actor, 'houndOfIllOmenTarget');
        if (!effect) return;
        let distance = tokenUtils.getDistance(token, hound.object);
        if (distance > 5 || 0 > distance) return;
        let effectData = {
            name: 'Condition Disadvantage',
            img: constants.tempConditionIcon,
            duration: {
                turns: 1
            },
            changes: [
                {
                    key: 'flags.midi-qol.disadvantage.ability.save.all',
                    value: '1',
                    mode: 5,
                    priority: 120
                }
            ],
            flags: {
                'chris-premades': {
                    specialDuration: ['endOfWorkflow']
                }
            }
        };
        await effectUtils.createEffect(token.actor, effectData, {animate: false});
    }));
}
export let houndOfIllOmen = {
    name: 'Hound of Ill Omen',
    version: '1.4.19',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 100
            }
        ]
    },
    config: [
        {
            value: 'monsterName',
            label: 'CHRISPREMADES.Config.MonsterName',
            type: 'text',
            default: 'Dire Wolf',
            category: 'mechanics'
        },
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'sorcerer',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'shadow',
            category: 'animation',
            options: constants.summonAnimationOptions
        }
    ]
};