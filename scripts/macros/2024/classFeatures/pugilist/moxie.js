import {animationUtils, compendiumUtils, constants, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function oneTwoPunch({workflow}) {
    if (!itemUtils.getConfig(workflow.item, 'promptForTargets')) return;
    let unarmedStrike = itemUtils.getItemByIdentifier(workflow.actor, 'pugilistUnarmedStrike') ?? itemUtils.getItemByIdentifier(workflow.actor, 'unarmedStrike');
    if (!unarmedStrike) return;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (animationUtils.jb2aCheck() != 'patreon') playAnimation = false;
    let target;
    let nearby;
    if (workflow.targets.size) {
        target = workflow.targets.first();
    } else {
        nearby = tokenUtils.findNearby(workflow.token, 5, 'enemy', {includeIncapacitated: true});
        if (!nearby.length) return;
        if (nearby.length === 1) {
            target = nearby[0];
        } else {
            let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectATarget', nearby, {skipDeadAndUnconscious: false});
            if (!selection) return;
            target = selection[0].object;
        }
    }
    let attacks = itemUtils.getConfig(workflow.item, 'attacks');
    let animationTargets = new Set();
    while (attacks) {
        await workflowUtils.specialItemUse(unarmedStrike, [target], workflow.item);
        animationTargets.add(target);
        attacks--;
        if (attacks) {
            nearby = tokenUtils.findNearby(workflow.token, 5, 'enemy', {includeIncapacitated: true});
            if (!nearby.length) break;
            if (nearby.length === 1) {
                target = nearby[0];
            } else {
                let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectATarget', nearby, {skipDeadAndUnconscious: false});
                if (!selection) break;
                target = selection[0];
            }
        }
    }
    if (!playAnimation) return;
    animationTargets.forEach(target => {
        /* eslint-disable indent */
        new Sequence()
            .effect()
                .copySprite(workflow.token)
                .attachTo(workflow.token)
                .size(workflow.token.document.width * workflow.token.document.texture.scaleX, {gridUnits: true})
                .fadeOut(150)
                .duration(1800)
                .zIndex(2)
            .effect()
                .delay(150)
                .file('jb2a.flurry_of_blows.no_hit.yellow')
                .atLocation(workflow.token)
                .stretchTo(target.center, {randomOffset: 0.2})
                .scale(0.6 * workflow.token.document.width)
                .playbackRate(1)
                .startTime(300)
                .endTime(600)
                .opacity(1)
                .rotate(0)
                .mirrorX(false)
                .repeats(3, 300, 300)
                .randomizeMirrorY()
                .spriteOffset({x: workflow.token.document.width * 0.25}, {gridUnits: true})
                .zIndex(1.1)
                .wait(300)
            .effect()
                .file('jb2a.impact.009.orange')
                .atLocation(target, {randomOffset: 1})
                .size(workflow.token.document.width * 1.25, {gridUnits: true})
                .repeats(20, 50, 50)
                .randomRotation()
            .effect()
                .copySprite(target)
                .atLocation(target)
                .fadeIn(200)
                .fadeOut(200)
                .loopProperty('sprite', 'position.x', {from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
                .scaleToObject(target.document.texture.scaleX)
                .duration(1400)
                .opacity(0.25)
            .play();
        /* eslint-enable indent */
    });
}
async function stickAndMove({workflow}) {    
    if (!itemUtils.getConfig(workflow.item, 'promptForTargets')) return;
    let unarmedStrike = itemUtils.getItemByIdentifier(workflow.actor, 'pugilistUnarmedStrike') ?? itemUtils.getItemByIdentifier(workflow.actor, 'unarmedStrike');
    if (!unarmedStrike) return;
    let target;
    let nearby;
    if (workflow.targets.size) {
        target = workflow.targets.first();
    } else {
        nearby = tokenUtils.findNearby(workflow.token, 5, 'enemy', {includeIncapacitated: true});
        if (nearby.length === 1) {
            target = nearby[0];
        } else {
            let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectATarget', nearby, {skipDeadAndUnconscious: false});
            target = selection[0].object;
        }
    }
    if (target) await workflowUtils.specialItemUse(unarmedStrike, [target], workflow.item);
    let rules = genericUtils.getRules(workflow.item);
    let pack = rules === 'modern' ? constants.modernPacks.actions : constants.packs.actions;
    let dash = await compendiumUtils.getItemFromCompendium(pack, 'dash', {byIdentifier: true});
    let disengage = await compendiumUtils.getItemFromCompendium(pack, 'disengage', {byIdentifier: true});
    let documents = [dash, disengage].filter(d => !!d);
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName:workflow.activity.name}), documents, {sortAlphabetical: true, displayReference: true});
    if (!selection) return;
    let documentData = genericUtils.duplicate(selection.toObject());
    let itemConfig = workflow.item.getFlag('chris-premades', 'config') ?? {};
    let config = genericUtils.mergeObject(genericUtils.duplicate(moxie.config), itemConfig);
    genericUtils.setProperty(documentData, 'flags.chris-premades.config', config);
    let translate = `CHRISPREMADES.Macros.Actions.${documentData.name}`;
    documentData.name = genericUtils.translate(translate);
    documentData.effects?.forEach(effectData => {
        effectData.name = genericUtils.translate(translate);
    });
    await workflowUtils.syntheticItemDataRoll(documentData, workflow.actor, [workflow.token]);
}
async function added({trigger: {entity: item}}) {
    await itemUtils.fixScales(item);
}
export let moxie = {
    name: 'Moxie',
    version: '1.4.25',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: oneTwoPunch,
                priority: 50,
                activities: ['oneTwoPunch']
            },
            {
                pass: 'rollFinished',
                macro: stickAndMove,
                priority: 50,
                activities: ['stickAndMove']
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 45
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 45
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 45
        }
    ],
    config: [
        {
            value: 'attacks',
            label: 'CHRISPREMADES.Config.Attacks',
            type: 'number',
            default: 2,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'pugilist',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'moxie',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'promptForTargets',
            label: 'CHRISPREMADES.Generic.PromptForTargets',
            type: 'checkbox',
            default: true,
            category: 'mechanics'
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'stepOfTheWind',
            category: 'animation',
            options: [
                {
                    value: 'stepOfTheWind',
                    label: 'CHRISPREMADES.Macros.Disengage.StepOfTheWind',
                    requiredModules: ['jb2a_patreon', 'animated-spell-effects-cartoon']
                },
                {
                    value: 'cunningAction',
                    label: 'CHRISPREMADES.Macros.Disengage.CunningAction',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'displayHint',
            label: 'CHRISPREMADES.Config.DisplayHint',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ],
    scales: [
        {
            classIdentifier: 'classIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'moxie',
                    type: 'number',
                    distance: {
                        units: ''
                    },
                    scale: {
                        2: {
                            value: 2
                        },
                        4: {
                            value: 3
                        },
                        6: {
                            value: 4
                        },
                        8: {
                            value: 5
                        },
                        10: {
                            value: 6
                        },
                        12: {
                            value: 7
                        },
                        14: {
                            value: 8
                        },
                        16: {
                            value: 9
                        },
                        18: {
                            value: 10
                        },
                        19: {
                            value: 11
                        },
                        20: {
                            value: 12
                        }
                    }
                },
                value: {},
                title: 'Moxie Points'
            }
        } 
    ],
    hasAnimation: true
};
