import {actorUtils, animationUtils, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils} from '../../utils.js';
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!workflow.failedSaves.size) {
        await genericUtils.remove(concentrationEffect);
        return;
    }
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.EnlargeReduce.Select', [['CHRISPREMADES.Macros.EnlargeReduce.Enlarge', 'enlarge'], ['CHRISPREMADES.Macros.EnlargeReduce.Reduce', 'reduce']]);
    if (!selection) {
        await genericUtils.remove(concentrationEffect);
        return;
    }
    if (selection === 'enlarge') {
        let effectData = {
            name: workflow.item.name,
            img: workflow.item.img,
            origin: workflow.item.uuid,
            duration: {
                seconds: 60 * workflow.item.system.duration.value
            },
            changes: [
                {
                    key: 'system.bonuses.mwak.damage',
                    mode: 2,
                    value: '+1d4',
                    priority: 20
                },
                {
                    key: 'system.bonuses.rwak.damage',
                    mode: 2,
                    value: '+1d4',
                    priority: 20
                },
                {
                    key: 'flags.midi-qol.advantage.ability.check.str',
                    mode: 0,
                    value: 1,
                    priority: 20
                },
                {
                    key: 'flags.midi-qol.advantage.ability.save.str',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ], 
            flags: {
                'chris-premades': {
                    enlargeReduce: {
                        selection,
                        playAnimation
                    },
                    effect: {
                        sizeAnimation: false
                    }
                }
            }
        };
        effectUtils.addMacro(effectData, 'effect', ['enlargeReduceChanged']);
        for (let targetToken of workflow.failedSaves) {
            let currEffectData = genericUtils.duplicate(effectData);
            let doGrow = true;
            let targetSize = targetToken.actor.system.traits.size;
            if (targetSize !== 'tiny' && targetSize !== 'sm') {
                let room = tokenUtils.checkForRoom(targetToken, 1);
                let direction = tokenUtils.findDirection(room);
                if (direction === 'none') doGrow = false;
            }
            let newSize = targetSize;
            if (doGrow) {
                switch (targetSize) {
                    case 'tiny':
                        newSize = 'sm';
                        break;
                    case 'sm':
                        newSize = 'med';
                        break;
                    case 'med':
                        newSize = 'lg';
                        break;
                    case 'lg':
                        newSize = 'huge';
                        break;
                    case 'huge':
                        newSize = 'grg';
                        break;
                }
            }
            currEffectData.flags['chris-premades'].enlargeReduce.origSize = targetSize;
            currEffectData.flags['chris-premades'].enlargeReduce.newSize = newSize;
            await effectUtils.createEffect(targetToken.actor, currEffectData, {concentrationItem: workflow.item, interdependent: true, identifier: 'enlargeReduceChanged'});
        }
    } else {
        let effectData = {
            name: workflow.item.name,
            img: workflow.item.img,
            origin: workflow.item.uuid,
            duration: {
                seconds: 60 * workflow.item.system.duration.value
            },
            changes: [
                {
                    key: 'system.bonuses.mwak.damage',
                    mode: 2,
                    value: '-1d4',
                    priority: 20
                },
                {
                    key: 'system.bonuses.rwak.damage',
                    mode: 2,
                    value: '-1d4',
                    priority: 20
                },
                {
                    key: 'flags.midi-qol.disadvantage.ability.check.str',
                    mode: 0,
                    value: 1,
                    priority: 20
                },
                {
                    key: 'flags.midi-qol.disadvantage.ability.save.str',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ], 
            flags: {
                'chris-premades': {
                    enlargeReduce: {
                        selection,
                        playAnimation
                    },
                    effect: {
                        sizeAnimation: false
                    }
                }
            }
        };
        effectUtils.addMacro(effectData, 'effect', ['enlargeReduceChanged']);
        for (let targetToken of workflow.failedSaves) {
            let currEffectData = genericUtils.duplicate(effectData);
            let targetSize = targetToken.actor.system.traits.size;
            let newSize = targetSize;
            switch (targetSize) {
                case 'sm':
                    newSize = 'tiny';
                    break;
                case 'med':
                    newSize = 'sm';
                    break;
                case 'lg':
                    newSize = 'med';
                    break;
                case 'huge':
                    newSize = 'lg';
                    break;
                case 'grg':
                    newSize = 'huge';
                    break;
            }
            currEffectData.flags['chris-premades'].enlargeReduce.origSize = targetSize;
            currEffectData.flags['chris-premades'].enlargeReduce.newSize = newSize;
            await effectUtils.createEffect(targetToken.actor, currEffectData, {concentrationItem: workflow.item, interdependent: true, identifier: 'enlargeReduceChanged'});
        }
    }
}
export async function start({trigger: {entity: effect}}) {
    let {selection, playAnimation, origSize, newSize} = effect.flags['chris-premades'].enlargeReduce;
    let token = actorUtils.getFirstToken(effect.parent);
    if (!token) return;
    if (!playAnimation || animationUtils.jb2aCheck() !== 'patreon') return;
    // Animations by: eskiemoh
    if (selection === 'enlarge') {
        let scale = 1;
        switch (origSize) {
            case 'sm':
                scale = 0.8;
                break;
            case 'tiny':
                scale = 0.5;
                break;
        }
        await new Sequence()
            .effect()
            .file('jb2a.static_electricity.03.orange')
            .atLocation(token)
            .duration(3000)
            .scaleToObject(1)
            .fadeIn(250)
            .fadeOut(250)
            .zIndex(2)
            
            .effect()
            .from(token)
            .atLocation(token)
            .scaleToObject(2)
            .duration(500)
            .scaleIn(0.25,500)
            .fadeIn(250)
            .fadeOut(250)
            .repeats(3, 500, 500)
            .opacity(0.2)
            .zIndex(1)
            
            .animation()
            .on(token)
            .opacity(0)
            
            .effect()
            .from(token)
            .atLocation(token)
            .loopProperty('sprite', 'position.x', {'from': -40, 'to': 40, 'duration': 75, 'pingPong': true, 'delay': 200})
            .scaleToObject(scale)
            .duration(2000)
            .waitUntilFinished(-200)
            .zIndex(0)
            
            .thenDo(async () => {
                let updates = {
                    changes: effect.changes.concat(
                        {
                            key: 'system.traits.size',
                            mode: 5,
                            value: newSize,
                            priority: 20
                        }
                    )
                };
                await genericUtils.update(effect, updates);
                let updates2 = {
                    'flags.chris-premades.effect.sizeAnimation': true
                };
                await genericUtils.update(effect, updates2);
            })
            
            .wait(200)
            
            .effect()
            .from(token)
            .atLocation(token)
            .scaleToObject(1)
            .duration(3000)
            .scaleIn(0.25,700, {'ease': 'easeOutBounce'})
            
            .effect()
            .file('jb2a.extras.tmfx.outpulse.circle.01.fast')
            .atLocation(token)
            .belowTokens()
            .opacity(0.75)
            .scaleToObject(2)
            .zIndex(1)
            
            .effect()
            .file('jb2a.impact.ground_crack.orange.02')
            .atLocation(token)
            .belowTokens()
            .scaleToObject(2)
            .zIndex(0)
            
            .effect()
            .file('jb2a.particles.outward.orange.01.04')
            .scaleIn(0.25, 500, {'ease': 'easeOutQuint'})
            .fadeIn(500)
            .fadeOut(1000)
            .atLocation(token)
            .randomRotation()
            .duration(3000)
            .scaleToObject(1.5)
            .zIndex(4)
            
            .effect()
            .file('jb2a.static_electricity.03.orange')
            .atLocation(token)
            .duration(5000)
            .scaleToObject(1)
            .fadeIn(250)
            .fadeOut(250)
            .waitUntilFinished(-3000)
            
            .animation()
            .on(token)
            .opacity(1)
            
            .play();
    } else {
        let scale = 1;
        switch (origSize) {
            case 'med':
                scale = 0.8;
                break;
            case 'sm':
                scale = 0.5;
                break;
            case 'tiny':
                scale = 0.25;
                break;
        }
        await new Sequence()
            .effect()
            .file('jb2a.static_electricity.03.orange')
            .atLocation(token)
            .duration(3000)
            .scaleToObject(1)
            .fadeIn(250)
            .fadeOut(250)
            .zIndex(2)

            .effect()
            .from(token)
            .atLocation(token)
            .scaleToObject(2)
            .duration(500)
            .scaleIn(0.25,500)
            .fadeIn(250)
            .fadeOut(250)
            .repeats(3, 500, 500)
            .opacity(0.2)
            .zIndex(1)

            .animation()
            .on(token)
            .opacity(0)

            .effect()
            .from(token)
            .atLocation(token)
            .loopProperty('sprite', 'rotation', {'from': -10, 'to': 10, 'duration': 75, 'pingPong': true, 'delay': 200})
            .duration(2000)
            .waitUntilFinished(-200)
            .zIndex(0)

            .thenDo(async () => {
                let updates = {
                    changes: effect.changes.concat(
                        {
                            key: 'system.traits.size',
                            mode: 5,
                            value: newSize,
                            priority: 20
                        }
                    )
                };
                await genericUtils.update(effect, updates);
                let updates2 = {
                    'flags.chris-premades.effect.sizeAnimation': true
                };
                await genericUtils.update(effect, updates2);
            })

            .wait(200)

            .effect()
            .from(token)
            .atLocation(token)
            .scaleToObject(scale)
            .duration(3000)
            .scaleIn(0.25, 700, {'ease': 'easeOutBounce'})

            .effect()
            .file('jb2a.extras.tmfx.outpulse.circle.01.fast')
            .atLocation(token)
            .opacity(0.75)
            .scaleToObject(2)
            .zIndex(1)

            .effect()
            .file('jb2a.energy_strands.in.yellow.01.2')
            .atLocation(token)
            .belowTokens()
            .scaleToObject(2)
            .zIndex(0)

            .effect()
            .file('jb2a.particles.outward.orange.01.04')
            .scaleIn(0.25, 500, {'ease': 'easeOutQuint'})
            .fadeIn(500)
            .fadeOut(1000)
            .atLocation(token)
            .randomRotation()
            .duration(3000)
            .scaleToObject(1.5)
            .zIndex(4)

            .effect()
            .file('jb2a.static_electricity.03.orange')
            .atLocation(token)
            .duration(5000)
            .scaleToObject(1)
            .fadeIn(250)
            .fadeOut(250)
            .waitUntilFinished(-3000)

            .animation()
            .on(token)
            .opacity(1)

            .play();
    }
}
export let enlargeReduce = {
    name: 'Enlarge/Reduce',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ]
};
export let enlargeReduceChanged = {
    name: 'Enlarge/Reduce: Changed',
    version: '0.12.0',
    effect: [
        {
            pass: 'created',
            macro: start,
            priority: 50
        }
    ]
};