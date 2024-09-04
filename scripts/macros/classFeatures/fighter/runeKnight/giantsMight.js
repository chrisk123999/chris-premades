import {actorUtils, animationUtils, effectUtils, genericUtils, itemUtils, tokenUtils} from '../../../../utils.js';
import {start as enlargeReduceStart} from '../../../spells/enlargeReduce.js';
async function use({workflow}) {
    if (effectUtils.getEffectByIdentifier(workflow.actor, 'giantsMight')) return;
    let greatStature = itemUtils.getItemByIdentifier(workflow.actor, 'greatStature');
    let runicJuggernaut = itemUtils.getItemByIdentifier(workflow.actor, 'runicJuggernaut');
    let currSize = actorUtils.getSize(workflow.actor);
    let canBeLarge = currSize < 3 && Object.values(tokenUtils.checkForRoom(workflow.token, 1)).some(i => i);
    let canBeHuge = runicJuggernaut && Object.values(tokenUtils.checkForRoom(workflow.token, 4 - Math.max(2, currSize))).some(i => i);
    let bonusDamage = runicJuggernaut ? '1d10' : (greatStature ? '1d8' : '1d6');
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'flags.midi-qol.advantage.ability.check.str',
                mode: 5,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.advantage.ability.save.str',
                mode: 5,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.optional.GiantsMight.damage.mwak',
                mode: 5,
                value: bonusDamage,
                priority: 20
            },
            {
                key: 'flags.midi-qol.optional.GiantsMight.damage.rwak',
                mode: 5,
                value: bonusDamage,
                priority: 20
            },
            {
                key: 'flags.midi-qol.optional.GiantsMight.label',
                mode: 5,
                value: workflow.item.name,
                priority: 20
            },
            {
                key: 'flags.midi-qol.optional.GiantsMight.count',
                mode: 5,
                value: 'turn',
                priority: 20
            }
        ]
    };
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck() === 'patreon';
    if (canBeLarge) {
        if (playAnimation) {
            genericUtils.setProperty(effectData, 'flags.chris-premades.enlargeReduce', {
                selection: 'enlarge',
                playAnimation: true,
                origSize: actorUtils.getSize(workflow.actor, true),
                newSize: canBeHuge ? 'huge' : 'lg'
            });
            genericUtils.setProperty(effectData, 'flags.chris-premades.effect.sizeAnimation', false);
        } else {
            effectData.changes.push({
                key: 'system.traits.size',
                mode: 5,
                value: canBeHuge ? 'huge' : 'lg',
                priority: 20
            });
        }
    }
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'giantsMight'});
    if (!playAnimation) return;
    if (effect.flags['chris-premades']?.enlargeReduce) await enlargeReduceStart({trigger: {entity: effect}});
}
export let giantsMight = {
    name: 'Giant\'s Might',
    version: '0.12.52',
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