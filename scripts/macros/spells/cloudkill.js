import {combatUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../utils.js';

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
                    name: workflow.item.name,
                    visibility: {
                        obscured: true
                    }
                },
                castData: {...workflow.castData, saveDC: itemUtils.getSaveDC(workflow.item)},
                macros: {
                    template: ['cloudkillCloud']
                },
                damageType: itemUtils.getConfig(workflow.item, 'damageType')
            },
            walledTemplates: {
                wallRestriction: 'move',
                wallsBlock: 'recurse'
            }
        }
    });
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        flags: {
            'chris-premades': {
                cloudkill: {
                    templateUuid: template.uuid
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'combat', ['cloudkillSource']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'cloudkill'});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function move({trigger: {entity: effect, token}}) {
    function getAllowedMoveLocation(casterToken, template, maxSquares) {
        for (let i = maxSquares; i > 0; i--) {
            let movePixels = i * canvas.grid.size;
            let ray = new Ray(casterToken.center, template.object.center);
            let newCenter = ray.project((ray.distance + movePixels)/ray.distance);
            let isAllowedLocation = canvas.visibility.testVisibility(newCenter, {object: template.object});
            if (isAllowedLocation) return newCenter;
        }
        return false;
    }
    let template = await fromUuid(effect.flags['chris-premades']?.cloudkill?.templateUuid);
    if (!template) return;
    let newCenter = getAllowedMoveLocation(token, template, 2);
    if (!newCenter) {
        genericUtils.notify('CHRISPREMADES.Macros.Cloudkill.NoRoom', 'info');
        return;
    }
    newCenter = canvas.grid.getSnappedPoint(newCenter, {mode: CONST.GRID_SNAPPING_MODES.TOP_LEFT_CORNER});
    await genericUtils.update(template, {x: newCenter.x, y: newCenter.y});
}
async function enterOrTurn({trigger: {entity: template, castData, token}}) {
    let [targetCombatant] = game.combat.getCombatantsByToken(token.document);
    if (!targetCombatant) return;
    if (!combatUtils.perTurnCheck(targetCombatant, 'cloudkill')) return;
    await combatUtils.setTurnCheck(targetCombatant, 'cloudkill');
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Cloudkill: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Cloudkill.Damage', flatDC: castData.saveDC});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let damageType = template.flags['chris-premades']?.damageType;
    featureData.system.damage.parts = [
        [
            castData.castLevel + 'd8[' + damageType + ']',
            damageType
        ]
    ];
    let sourceActor = (await templateUtils.getSourceActor(template)) ?? token.actor;
    await workflowUtils.syntheticItemDataRoll(featureData, sourceActor, [token]);
}
// TODO: Maybe add darkness source attached to template
export let cloudkill = {
    name: 'Cloudkill',
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
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'poison',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
export let cloudkillSource = {
    name: 'Cloudkill: Source',
    version: cloudkill.version,
    combat: [
        {
            pass: 'turnStart',
            macro: move,
            priority: 50
        }
    ]
};
export let cloudkillCloud = {
    name: 'Cloudkill: Cloud',
    version: cloudkill.version,
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