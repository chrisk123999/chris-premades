import {chris} from '../../helperFunctions.js';
async function enlargeAnimation(token, updates, name, callbacks) {
    //Animations by: eskiemoh
    let scale = 1;
    let size = chris.getSize(token.actor, true);
    switch (size) {
        case 'small':
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
            let options = {
                'permanent': false,
                'name': name,
                'description': name,
                'updateOpts': {'token': {'animate': false}}
            };
            await warpgate.mutate(token.document, updates, callbacks, options);
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
}
async function reduceAnimation(token, updates, name) {
    //Animations by: eskiemoh
    let scale = 1;
    let size = chris.getSize(token.actor, true);
    switch (size) {
        case 'medium':
            scale = 0.8;
            break;
        case 'small':
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
            let options = {
                'permanent': false,
                'name': name,
                'description': name,
                'updateOpts': {'token': {'animate': false}}
            };
            await warpgate.mutate(token.document, updates, {}, options);
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
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size != 1) return;
    let animate = chris.getConfiguration(workflow.item, 'animation') ?? true;
    if (chris.jb2aCheck() != 'patreon') animate = false;
    let selection = await chris.dialog(workflow.item.name, [['Enlarge', 'enlarge'], ['Reduce', 'reduce']], 'Enlarge or Reduce?');
    if (!selection) return;
    let targetToken = workflow.targets.first();
    if (selection === 'enlarge') {
        async function effectMacro() {
            await chrisPremades.macros.enlargeReduce.end(token);
        }
        let effectData = {
            'name': workflow.item.name,
            'icon': workflow.item.img,
            'origin': workflow.item.uuid,
            'duration': {
                'seconds': 60
            },
            'changes': [
                {
                    'key': 'system.bonuses.mwak.damage',
                    'mode': 2,
                    'value': '+1d4',
                    'priority': 20
                },
                {
                    'key': 'system.bonuses.rwak.damage',
                    'mode': 2,
                    'value': '+1d4',
                    'priority': 20
                },
                {
                    'key': 'flags.midi-qol.advantage.ability.check.str',
                    'mode': 0,
                    'value': '1',
                    'priority': 20
                },
                {
                    'key': 'flags.midi-qol.advantage.ability.save.str',
                    'mode': 0,
                    'value': '1',
                    'priority': 20
                }
            ],
            'flags': {
                'effectmacro': {
                    'onDelete': {
                        'script': chris.functionToString(effectMacro)
                    }
                },
                'chris-premades': {
                    'spell': {
                        'enlargeReduce': selection
                    }
                }
            }
        };
        let token = {};
        let actor = {};
        let doGrow = true;
        let targetSize = targetToken.actor.system.traits.size;
        if (targetSize != 'tiny' || targetSize != 'sm') {
            let room = chris.checkForRoom(targetToken, 1);
            let direction = chris.findDirection(room);
            switch(direction) {
                case 'none':
                    doGrow = false;
                    break;
                case 'ne':
                    setProperty(token, 'y', targetToken.y - canvas.grid.size);
                    break;
                case 'sw':
                    setProperty(token, 'x', targetToken.x - canvas.grid.size);
                    break;
                case 'nw':
                    setProperty(token, 'x', targetToken.x - canvas.grid.size);
                    setProperty(token, 'y', targetToken.y - canvas.grid.size);
                    break;
            }
        }
        if (doGrow) {
            switch (targetSize) {
                case 'tiny':
                    setProperty(token, 'texture.scaleX', '0.8');
                    setProperty(token, 'texture.scaleY', '0.8');
                    setProperty(actor, 'system.traits.size', 'sm');
                    break;
                case 'sm':
                    setProperty(token, 'texture.scaleX', '1');
                    setProperty(token, 'texture.scaleY', '1');
                    setProperty(actor, 'system.traits.size', 'med');
                    break;
                case 'med':
                    setProperty(token, 'height', targetToken.document.height + 1);
                    setProperty(token, 'width', targetToken.document.width + 1);
                    setProperty(actor, 'system.traits.size', 'lg');
                    break;
                case 'lg':
                    setProperty(token, 'height', targetToken.document.height + 1);
                    setProperty(token, 'width', targetToken.document.width + 1);
                    setProperty(actor, 'system.traits.size', 'huge');
                    break;
                case 'huge':
                    setProperty(token, 'height', targetToken.document.height + 1);
                    setProperty(token, 'width', targetToken.document.width + 1);
                    setProperty(actor, 'system.traits.size', 'grg');
                    break;
                case 'grg':
                    setProperty(token, 'height', targetToken.document.height + 1);
                    setProperty(token, 'width', targetToken.document.width + 1);
                    break;
            }
        }
        let updates = {
            'token': token,
            'actor': actor,
            'embedded': {
                'ActiveEffect': {
                    [effectData.name]: effectData
                }
            }
        };
        let callbacks = {
            'delta': (delta, tokenDoc) => {
                if ('x' in delta.token) delete delta.token.x;
                if ('y' in delta.token) delete delta.token.y;
            }
        };
        if (animate) {
            await enlargeAnimation(targetToken, updates, 'Enlarge/Reduce', callbacks);
        } else {
            let options = {
                'permanent': false,
                'name': 'Enlarge/Reduce',
                'description': 'Enlarge/Reduce'
            };
            await warpgate.mutate(targetToken.document, updates, callbacks, options);
        }
    } else {
        async function effectMacro() {
            await chrisPremades.macros.enlargeReduce.end(token);
        }
        let effectData = {
            'name': workflow.item.name,
            'icon': workflow.item.img,
            'origin': workflow.item.uuid,
            'duration': {
                'seconds': 60
            },
            'changes': [
                {
                    'key': 'system.bonuses.mwak.damage',
                    'mode': 2,
                    'value': '-1d4',
                    'priority': 20
                },
                {
                    'key': 'system.bonuses.rwak.damage',
                    'mode': 2,
                    'value': '-1d4',
                    'priority': 20
                },
                {
                    'key': 'flags.midi-qol.disadvantage.ability.check.str',
                    'mode': 0,
                    'value': '1',
                    'priority': 20
                },
                {
                    'key': 'flags.midi-qol.disadvantage.ability.save.str',
                    'mode': 0,
                    'value': '1',
                    'priority': 20
                }
            ],
            'flags': {
                'effectmacro': {
                    'onDelete': {
                        'script': chris.functionToString(effectMacro)
                    }
                },
                'chris-premades': {
                    'spell': {
                        'enlargeReduce': selection
                    }
                }
            }
        };
        let token = {};
        let actor = {};
        let targetSize = targetToken.actor.system.traits.size;
        switch (targetSize) {
            case 'tiny':
                setProperty(token, 'texture.scaleX', '0.25');
                setProperty(token, 'texture.scaleY', '0.25');
            case 'sm':
                setProperty(token, 'texture.scaleX', '0.5');
                setProperty(token, 'texture.scaleY', '0.5');
                setProperty(actor, 'system.traits.size', 'tiny');
                break;
            case 'med':
                setProperty(token, 'texture.scaleX', '0.8');
                setProperty(token, 'texture.scaleY', '0.8');
                setProperty(actor, 'system.traits.size', 'sm');
                break;
            case 'lg':
                setProperty(token, 'height', targetToken.document.height - 1);
                setProperty(token, 'width', targetToken.document.width - 1);
                setProperty(actor, 'system.traits.size', 'med');
                break;
            case 'huge':
                setProperty(token, 'height', targetToken.document.height - 1);
                setProperty(token, 'width', targetToken.document.width - 1);
                setProperty(actor, 'system.traits.size', 'lg');
                break;
            case 'grg':
                setProperty(token, 'height', targetToken.document.height - 1);
                setProperty(token, 'width', targetToken.document.width - 1);
                setProperty(actor, 'system.traits.size', 'huge');
                break;
        }
        let updates = {
            'token': token,
            'actor': actor,
            'embedded': {
                'ActiveEffect': {
                    [effectData.name]: effectData
                }
            }
        };
        if (animate) {
            await reduceAnimation(targetToken, updates, 'Enlarge/Reduce');
        } else {
            let options = {
                'permanent': false,
                'name': 'Enlarge/Reduce',
                'description': 'Enlarge/Reduce'
            };
            await warpgate.mutate(targetToken.document, updates, {}, options);
        }
    }
    await chris.addDependent(MidiQOL.getConcentrationEffect(workflow.actor, workflow.item), [targetToken.actor.effects.getName(workflow.item.name)]);
}
async function end(token, origin) {
    await warpgate.revert(token.document, 'Enlarge/Reduce', {'updateOpts': {'token': {'animate': true}}});
}
export let enlargeReduce = {
    'enlargeAnimation': enlargeAnimation,
    'reduceAnimation': reduceAnimation,
    'item': item,
    'end': end
}