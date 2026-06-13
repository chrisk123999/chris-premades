import {animationUtils, effectUtils, genericUtils, itemUtils} from '../../../utils.js';
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        changes: [
            {
                key: 'flags.midi-qol.magicResistance.all',
                value: '1',
                mode: 0,
                priority: 20
            },
            {
                key: 'flags.midi-qol.semiSuperSaver.all',
                value: 'item?.type === "spell" || item?.flags.midiProperties?.magiceffect',
                mode: 0,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                showIcon: itemUtils.getConfig(workflow.item, 'showIcon')
            }
        }
    };
    effectUtils.addMacro(effectData, 'aura', ['circleOfPowerActive']);
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, identifier: 'circleOfPower', strictlyInterdependent: true});
    if (!itemUtils.getConfig(workflow.item, 'playAnimation')) return;
    if (!animationUtils.sequencerCheck() || !['patreon', 'free'].includes(animationUtils.jb2aCheck())) return;
    if (workflow.template) await genericUtils.remove(workflow.template);
    let grids = workflow.token.document.width + 2 * Math.floor(circleOfPowerActive.aura[0].distance / (workflow.token.scene?.grid?.distance ?? canvas.grid.distance));
    let school = CONFIG.DND5E.spellSchools[workflow.item.system.school || 'abj']?.fullKey;
    let color = itemUtils.getConfig(workflow.item, 'color');
    /* eslint-disable indent */
    new Sequence()
        .effect(`jb2a.magic_signs.circle.02.${school}.intro.${color}`)
            .atLocation(workflow.token)
            .size(grids, {gridUnits: true})
            .belowTokens()
            .attachTo(workflow.token)
        .waitUntilFinished(-1100)
        .effect(`jb2a.token_border.circle.static.${color}.001`)
            .atLocation(workflow.token)
            .size(grids, {gridUnits: true})
            .spriteScale(2)
            .fadeIn(200)
            .fadeOut(200)
            .belowTokens()
            .persist()
            .attachTo(workflow.token)
            .tieToDocuments(effect)
            .name('circleOfPower-' + workflow.actor.uuid)
        .play();
    /* eslint-enable indent */
}
async function create({trigger: {entity: effect, target, identifier}}) {
    if (effect.parent.uuid === target.actor.uuid) return;
    let targetEffect = effectUtils.getEffectByIdentifier(target.actor, identifier);
    if (targetEffect) return;
    let effectData = {
        name: effect.name,
        img: effect.img,
        origin: effect.uuid,
        changes: effect.changes,
        duration: {
            seconds: effect.duration.remaining
        },
        flags: {
            'chris-premades': {
                aura: true,
                effect: {
                    noAnimation: true
                }
            },
            dae: {
                showIcon: effect.flags['chris-premades']?.showIcon
            }
        }
    };
    return {
        effectData,
        effectOptions: {
            identifier
        }
    };
}
export let circleOfPower = {
    name: 'Circle of Power',
    version: '1.5.37',
    hasAnimation: true,
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
            value: 'showIcon',
            label: 'CHRISPREMADES.Config.ShowIcon',
            type: 'checkbox',
            default: true,
            category: 'visuals'
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'color',
            label: 'CHRISPREMADES.Config.Color',
            type: 'select',
            default: 'blue',
            category: 'animation',
            options: [
                {
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                    value: 'blue'
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    value: 'green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Purple',
                    value: 'purple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.DarkRed',
                    value: 'dark_red',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        }
    ]
};
export let circleOfPowerActive = {
    name: 'Circle of Power Active',
    version: circleOfPower.version,
    aura: [
        {
            pass: 'create',
            macro: create,
            priority: 50,
            distance: 30,
            identifier: 'circleOfPowerAura',
            disposition: 'ally'
        }
    ]
};
