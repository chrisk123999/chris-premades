import {animationUtils, combatUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../utils.js';
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
            seconds: itemUtils.convertDuration(workflow.item).seconds
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
    if (!itemUtils.getConfig(workflow.item, 'playAnimation')) return;
    if (animationUtils.jb2aCheck() != 'patreon') return;
    new Sequence()
        .effect()
        .file('jb2a.fog_cloud.02.green')
        .scaleToObject(1.05)
        .aboveInterface()
        .opacity(0.9)
        .xray(true)
        .mask(template)
        .persist(true)
        .attachTo(template)
        .play();
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
    if (combatUtils.inCombat()) {
        let touchedTokens = template.flags['chris-premades']?.cloudkill?.touchedTokens?.[combatUtils.currentTurn()] ?? [];
        if (touchedTokens.includes(token.id)) return;
        touchedTokens.push(token.id);
        await genericUtils.setFlag(template, 'chris-premades', 'cloudkill.touchedTokens.' + combatUtils.currentTurn(), touchedTokens);
    }
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Cloudkill: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Cloudkill.Damage', flatDC: castData.saveDC});
    if (!featureData) {
        errors.missingPackItem(constants.packs.spellFeatures, 'Cloudkill: Damage');
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
async function endCombat({trigger}) {
    await genericUtils.setFlag(trigger.entity, 'chris-premades', 'cloudkill.touchedTokens', null);
}
// TODO: Maybe add darkness source attached to template
export let cloudkill = {
    name: 'Cloudkill',
    version: '1.0.28',
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
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
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
        },
        {
            pass: 'combatEnd',
            macro: endCombat,
            priority: 50
        }
    ]
};