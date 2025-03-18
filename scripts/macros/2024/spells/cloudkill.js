import {activityUtils, animationUtils, combatUtils, effectUtils, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../../utils.js';

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
                    },
                    rules: 'modern',
                },
                castData: {...workflow.castData, saveDC: itemUtils.getSaveDC(workflow.item)},
                macros: {
                    template: ['cloudkillCloud']
                }
            }
        }
    });
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                cloudkill: {
                    templateUuid: template.uuid
                }
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item,
        strictlyInterdependent: true,
        identifier: 'cloudkill',
        rules: 'modern',
        macros: [{type: 'combat', macros: ['cloudkillSource']}]
    });
    if (!itemUtils.getConfig(workflow.item, 'playAnimation')) return;
    if (animationUtils.jb2aCheck() !== 'patreon') return;
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
    } else {
        newCenter = canvas.grid.getSnappedPoint(newCenter, {mode: CONST.GRID_SNAPPING_MODES.TOP_LEFT_CORNER});
        await genericUtils.update(template, {x: newCenter.x, y: newCenter.y});
    }
    let targets = Array.from(templateUtils.getTokensInTemplate(template)) ?? [];
    if (combatUtils.inCombat()) {
        let touchedTokens = template.flags['chris-premades']?.cloudkill?.touchedTokens?.[combatUtils.currentTurn()] ?? [];
        targets = targets.filter(i => !touchedTokens.includes(i.id));
        touchedTokens.push(...targets.map(i => i.id));
        await genericUtils.setFlag(template, 'chris-premades', 'cloudkill.touchedTokens.' + combatUtils.currentTurn(), touchedTokens);
    }
    if (!targets.length) return;
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(template.flags.dnd5e.item), 'cloudkillDamage', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, targets, {atLevel: templateUtils.getCastLevel(template)});
}
async function enterOrTurn({trigger: {entity: template, castData, token}}) {
    if (combatUtils.inCombat()) {
        let touchedTokens = template.flags['chris-premades']?.cloudkill?.touchedTokens?.[combatUtils.currentTurn()] ?? [];
        if (touchedTokens.includes(token.id)) return;
        touchedTokens.push(token.id);
        await genericUtils.setFlag(template, 'chris-premades', 'cloudkill.touchedTokens.' + combatUtils.currentTurn(), touchedTokens);
    }
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(template.flags.dnd5e.item), 'cloudkillDamage', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [token], {atLevel: castData.castLevel});
}
async function endCombat({trigger}) {
    await genericUtils.setFlag(trigger.entity, 'chris-premades', 'cloudkill.touchedTokens', null);
}
export let cloudkill = {
    name: 'Cloudkill',
    version: '1.2.28',
    hasAnimation: true,
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['cloudkill']
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
export let cloudkillSource = {
    name: 'Cloudkill: Source',
    version: cloudkill.version,
    rules: cloudkill.rules,
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
    rules: cloudkill.rules,
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
            pass: 'turnEnd',
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