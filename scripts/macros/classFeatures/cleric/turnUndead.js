import {actorUtils, animationUtils, constants, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function early({workflow}) {
    if (!workflow.targets.size) return;
    let advData = {
        name: 'Turn Advantage',
        img: constants.tempConditionIcon,
        duration: {
            turns: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.advantage.ability.save.wis',
                value: 1,
                mode: 5,
                priority: 120
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'isSave'
                ],
            },
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    let immuneData = {
        name: 'Turn Immunity',
        img: constants.tempConditionIcon,
        duration: {
            turns: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.min.ability.save.wis',
                value: 100,
                mode: 5,
                priority: 120
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'isSave'
                ]
            },
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    let validTargets = [];
    for (let i of workflow.targets) {
        if (actorUtils.typeOrRace(i.actor) !== 'undead') continue;
        if (i.actor.system.attributes.hp.value === 0) continue;
        if (i.actor.flags['chris-premades']?.turnResistance) await effectUtils.createEffect(i.actor, advData);
        if (i.actor.flags['chris-premades']?.turnImmunity) await effectUtils.createEffect(i.actor, immuneData);
        validTargets.push(i);
    }
    genericUtils.updateTargets(validTargets);
}
async function use({workflow}) {
    if (!workflow.failedSaves.size) return;
    let classIdentifier = itemUtils.getConfig(workflow.item, 'classIdentifier') ?? 'cleric';
    let classLevels = workflow.actor.classes[classIdentifier]?.system?.levels;
    if (!classLevels || classLevels < 5) return;
    let destroyLevel = workflow.actor.system.scale[classIdentifier]?.['destroy-undead']?.value;
    if (!destroyLevel) destroyLevel = Math.clamp(Math.floor((classLevels - 5) / 3), 0.5, 4);
    let destroyTokens = [];
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck();
    for (let i of workflow.failedSaves) {
        let CR = actorUtils.getLevelOrCR(i.actor) ?? 0;
        if (CR > destroyLevel) continue;
        destroyTokens.push(i);
        if (playAnimation) new Sequence().effect().atLocation(i).file('jb2a.divine_smite.target.blueyellow').play();
    }
    if (!destroyTokens.length) return;
    await workflowUtils.applyDamage(destroyTokens, 10000, 'none');
}
export let turnUndead = {
    name: 'Channel Divinity: Turn Undead',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'cleric',
            category: 'mechanics'
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ]
};