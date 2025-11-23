import {actorUtils, constants, effectUtils, genericUtils, itemUtils, tokenUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let sound = itemUtils.getConfig(workflow.item, 'sound');
    let ignoredCreatureTypes = itemUtils.getConfig(workflow.item, 'ignoredCreatureTypes');
    let animation = {
        animationPath: playAnimation ? 'jb2a.antilife_shell.blue_no_circle' : undefined,
        animationSize: workflow.token.document.width + 4,
        animationSound: sound
    };
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                antilifeShell: {
                    ignoredCreatureTypes
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'movement', ['antilifeShellSelfMove', 'antilifeShellOtherMove']);
    effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item,
        interdependent: true,
        rules: 'modern'
    }, animation);
}
async function moved({trigger}) {
    let ignoredCreatureTypes = trigger.entity.flags['chris-premades']?.antilifeShell?.ignoredCreatureTypes ?? [];
    let nearbyTokens = tokenUtils.findNearby(trigger.token, 10, 'all').filter(token => {
        if (['dead', 'unconscious'].some(s => token.actor.statuses.has(s))) return false;
        if (ignoredCreatureTypes.includes(actorUtils.typeOrRace(token.actor))) return false;
        return true;
    });
    if (!nearbyTokens.length) return;
    await genericUtils.remove(trigger.entity);
}
async function movedNear({trigger}) {
    let ignoredCreatureTypes = trigger.entity.flags['chris-premades']?.antilifeShell?.ignoredCreatureTypes;
    if (ignoredCreatureTypes?.length) {
        if (ignoredCreatureTypes.includes(actorUtils.typeOrRace(trigger.target.actor))) return;
    }
    await tokenUtils.pushToken(trigger.token, trigger.target, 15 - trigger.distance);
}
export let antilifeShell = {
    name: 'Antilife Shell',
    version: '1.1.10',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    rules: 'modern',
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'sound',
            label: 'CHRISPREMADES.Config.Sound',
            type: 'file',
            default: '',
            category: 'sound'
        },
        {
            value: 'ignoredCreatureTypes',
            label: 'CHRISPREMADES.Config.IgnoredCreatureTypes',
            type: 'select-many',
            default: ['undead', 'construct'],
            options: constants.creatureTypeOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let antilifeShellOtherMove = {
    name: antilifeShell.name,
    version: antilifeShell.version,
    rules: 'modern',
    movement: [
        {
            pass: 'movedNear',
            macro: movedNear,
            priority: 50,
            distance: 10
        },
        {
            pass: 'moved',
            macro: moved,
            priority: 50
        }
    ]
};