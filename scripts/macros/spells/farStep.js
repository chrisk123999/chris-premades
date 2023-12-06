import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.token || !workflow.actor) return;
    let queueSetup = queue.setup(workflow.item.uuid, 'farStep', 50);
    if (!queueSetup) return;
    await workflow.actor.sheet.minimize();
    await teleport(workflow.item, workflow.token, true);
    await workflow.actor.sheet.maximize();
    queue.remove(workflow.item.uuid);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Far Step - Teleport', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Far Step - Teleport');
    async function effectMacro() {
        await chrisPremades.macros.farStep.end(token, origin);
    }
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 60
        },
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'vae': {
                    'button': featureData.name
                }
            }
        }
    };
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Far Step',
        'description': 'Far Step'
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}
async function teleport(item, token, passive) {
    let interval = token.document.width % 2 === 0 ? 1 : -1;
    let position = await chris.aimCrosshair(token, 60, token.document.texture.src, interval, token.document.width);
    if (position.cancelled) return;
    let animation = chris.getConfiguration(item, 'animation') ?? 'default';
    if (chris.jb2aCheck() != 'patreon') animation === 'simple';
    if (animation === 'simple') {
        await new Sequence()
            .effect()
            .file('jb2a.misty_step.01.blue')
            .atLocation(token)
            .randomRotation()
            .scaleToObject(2)
            .wait(750)
            .animation()
            .on(token)
            .opacity(0.0)
            .waitUntilFinished()
            .play();
        let newCenter = canvas.grid.getSnappedPosition(position.x - token.w / 2, position.y - token.h / 2, 1);
        let targetUpdate = {
            'token': {
                'x': newCenter.x,
                'y': newCenter.y
            }
        };
        let options = {
            'permanent': true,
            'name': 'Far Step Teleport',
            'description': 'Far Step Teleport',
            'updateOpts': {'token': {'animate': false}}
        };
        await warpgate.mutate(token.document, targetUpdate, {}, options);
        await new Sequence()
            .effect()
            .file('jb2a.misty_step.02.blue')
            .atLocation(token)
            .randomRotation()
            .scaleToObject(2)
            .wait(1500)
            .animation()
            .on(token)
            .opacity(1.0)
            .play();
    } else {
        let selected = token.document;
        //Animations by: eskiemoh
        new Sequence()
            .effect()
            .file('jb2a.explosion.07.bluewhite')
            .atLocation(position)
            .scaleIn(0, 500, {'ease': 'easeOutCubic'})
            .fadeOut(1000)
            .scale({'x': selected.width / 4, 'y': selected.height / 4})
            
            .animation()
            .on(selected)
            .opacity(0)
            
            .effect()
            .file('jb2a.energy_strands.range.standard.blue.04')
            .atLocation(selected)
            .stretchTo(position)
            .waitUntilFinished(-2000)
            .playbackRate(1.25)
            
            .effect()
            .file('jb2a.explosion.07.bluewhite')
            .atLocation(position)
            .scale({'x': selected.width / 4, 'y': selected.height / 4})
            .scaleIn(0, 500, {'ease': 'easeOutCubic'})
            .fadeOut(1000)
            
            .animation()
            .on(selected)
            .teleportTo(position)
            .snapToGrid()
            .offset({'x': -1, 'y': -1 })
            .waitUntilFinished()
            
            .animation()
            .on(selected)
            .opacity(1)
            .waitUntilFinished()
            
            .play();

        if (passive) new Sequence()            
            .effect()
            .file('jb2a.token_border.circle.spinning.blue.001')
            .name('Far Step')
            .scaleIn(0, 1000, {'ease': 'easeOutElastic'})
            .persist()
            .scaleOut(0, 500, {'ease': 'easeOutElastic'})
            .atLocation(selected)
            .attachTo(selected, {'bindAlpha': false})
            .scaleToObject(2)
            .play();
    }
    await warpgate.wait(1000);
}
async function end(token, origin) {
    await warpgate.revert(token.document, 'Far Step');
    let animation = chris.getConfiguration(origin, 'animation') ?? 'default';
    if (chris.jb2aCheck() != 'patreon') animation === 'simple';
    if (animation === 'simple') return;
    await Sequencer.EffectManager.endEffects({'name': 'Far Step'});
}
async function bonus({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.token || !workflow.actor) return;
    let queueSetup = queue.setup(workflow.item.uuid, 'farStepBonus', 50);
    if (!queueSetup) return;
    let feature = chris.getItem(workflow.actor, 'Far Step');
    if (!feature) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await workflow.actor.sheet.minimize();
    await teleport(workflow.item, workflow.token, false);
    await workflow.actor.sheet.maximize();
    queue.remove(workflow.item.uuid);
}
export let farStep = {
    'item': item,
    'end': end,
    'teleport': teleport,
    'bonus': bonus
}