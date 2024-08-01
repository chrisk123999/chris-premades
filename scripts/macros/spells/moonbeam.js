import {crosshairUtils} from '../../lib/utilities/crosshairUtils.js';
import {actorUtils, combatUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let template = workflow.template;
    if (!template) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    await genericUtils.update(template, {
        flags: {
            'chris-premades': {
                template: {
                    name: workflow.item.name
                },
                castData: {...workflow.castData, saveDC: itemUtils.getSaveDC(workflow.item)},
                macros: {
                    template: ['moonbeamBeam']
                }
            }
        }
    });
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Moonbeam: Move', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Moonbeam.Move', identifier: 'moonbeamMove'});
    if (!featureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    effectUtils.addMacro(featureData, 'midi.item', ['moonbeamMove']);
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        flags: {
            'chris-premades': {
                moonbeam: {
                    templateUuid: template.uuid
                }
            }
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, vae: [{type: 'use', name: featureData.name, identifier: 'moonbeamMove'}], identifier: 'moonbeam'});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.Section.SpellFeatures')});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function move({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'moonbeam');
    let template = await fromUuid(effect?.flags['chris-premades'].moonbeam.templateUuid);
    if (!template) return;
    await workflow.actor.sheet.minimize();
    let position = await crosshairUtils.aimCrosshair({token: workflow.token, maxRange: 60, centerpoint: template.object.center, crosshairsConfig: {icon: effect.img, resolution: 2, size: template.distance}, drawBoundries: true});
    await workflow.actor.sheet.maximize();
    if (position.cancelled) return;
    await genericUtils.update(template, {
        x: position.x ?? template.x,
        y: position.y ?? template.y
    });
}
async function enterOrTurn({trigger: {entity: template, castData, token}}) {
    let [targetCombatant] = game.combat.getCombatantsByToken(token.document);
    if (!targetCombatant) return;
    if (!combatUtils.perTurnCheck(targetCombatant, 'moonbeam')) return;
    await combatUtils.setTurnCheck(targetCombatant, 'moonbeam');
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Moonbeam: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Moonbeam.Damage', flatDC: castData.saveDC});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    featureData.system.damage.parts = [
        [
            castData.castLevel + 'd10[radiant]',
            'radiant'
        ]
    ];
    let sourceActor = (await templateUtils.getSourceActor(template)) ?? token.actor;
    if (actorUtils.isShapeChanger(token.actor)) {
        let effectData = {
            name: genericUtils.translate('CHRISPREMADES.GenericEffects.ConditionDisadvantage'),
            img: 'icons/magic/time/arrows-circling-green.webp',
            origin: template.uuid,
            duration: {
                turns: 1
            },
            changes: [
                {
                    key: 'flags.midi-qol.disadvantage.ability.save.all',
                    value: 1,
                    mode: 5,
                    priority: 120
                }
            ],
            flags: {
                dae: {
                    specialDuration: [
                        'isDamaged'
                    ]
                },
                'chris-premades': {
                    effect: {
                        noAnimation: true
                    }
                }
            }
        };
        await effectUtils.createEffect(token.actor, effectData);
    }
    await workflowUtils.syntheticItemDataRoll(featureData, sourceActor, [token]);
}
export let moonbeam = {
    name: 'Moonbeam',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};
export let moonbeamMove = {
    name: 'Moonbeam: Move',
    version: moonbeam.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: move,
                priority: 50
            }
        ]
    }
};
export let moonbeamBeam = {
    name: 'Moonbeam: Beam',
    version: moonbeam.version,
    template: [
        {
            pass: 'enter',
            macro: enterOrTurn,
            priority: 50
        },
        {
            pass: 'passedThrough',
            macro: enterOrTurn,
            priority: 50
        },
        {
            pass: 'turnStart',
            macro: enterOrTurn,
            priority: 50
        }
    ]
};