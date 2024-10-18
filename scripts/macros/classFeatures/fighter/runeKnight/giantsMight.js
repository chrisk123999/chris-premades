import {actorUtils, animationUtils, combatUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
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
            }
        ],
        flags: {
            'chris-premades': {
                giantsMight: {
                    bonusDamage: bonusDamage
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['giantsMightEffect']);
    effectUtils.addMacro(effectData, 'combat', ['giantsMightEffect']);
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
async function damage({trigger, workflow}) {
    if (!workflow.hitTargets.size || !workflow.item.system.damage.parts.length) return;
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    if (combatUtils.inCombat()) {
        if (!combatUtils.perTurnCheck(trigger.entity, 'giantsMight', true, workflow.token.id)) return;
    }
    let selection = await dialogUtils.confirm(trigger.entity.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: trigger.entity.name}));
    if (!selection) return;
    let feature = await fromUuid(trigger.entity.origin);
    if (!feature) return;
    await feature.displayCard({flags: {dnd5e: {use: {consumedUsage: true, consumeResource: true}}}});
    if (combatUtils.inCombat()) await combatUtils.setTurnCheck(trigger.entity, 'giantsMight');
    let bonusDamage = trigger.entity.flags['chris-premades']?.giantsMight?.bonusDamage;
    if (!bonusDamage) return;
    await workflowUtils.bonusDamage(workflow, bonusDamage + '[' + workflow.defaultDamageType + ']', {damageType: workflow.defaultDamageType});
}
async function endCombat({trigger}) {
    await combatUtils.setTurnCheck(trigger.entity, 'giantsMight', true);
}
export let giantsMight = {
    name: 'Giant\'s Might',
    version: '1.0.20',
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
export let giantsMightEffect = {
    name: 'Giant\'s Might Effect',
    version: giantsMight.version,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 150
            }
        ]
    },
    combat: [
        {
            pass: 'combatEnd',
            macro: endCombat,
            priority: 50
        }
    ]
};