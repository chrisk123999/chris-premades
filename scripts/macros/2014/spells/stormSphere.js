import {activityUtils, actorUtils, animationUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../../utils.js';

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
                    template: ['stormSphereTemplate']
                }
            }
        }
    });
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'stormSphereBolt', {strict: true});
    if (!feature) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                stormSphere: {
                    templateUuid: template.uuid,
                    alreadyIgnores: workflow.actor.flags['midi-qol']?.ignoreNearbyFoes ?? false,
                    playAnimation: itemUtils.getConfig(workflow.item, 'playAnimation')
                },
                castData: workflow.castData
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item, 
        strictlyInterdependent: true, 
        identifier: 'stormSphere', 
        vae: [{
            type: 'use', 
            name: feature.name,
            identifier: 'stormSphere', 
            activityIdentifier: 'stormSphereBolt'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['stormSphereBolt'],
            favorite: true
        }
    });
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
}
async function endTurn({trigger: {entity: template, castData, token}}) {
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(template.flags.dnd5e.item), 'stormSphereTurn', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [token], {atLevel: castData.castLevel});
}
async function veryEarly({actor, config, dialog}) {
    dialog.configure = false;
    if (game.user.targets.size !== 1) return;
    let effect = effectUtils.getEffectByIdentifier(actor, 'stormSphere');
    if (!effect) return;
    let {alreadyIgnores} = effect.flags['chris-premades'].stormSphere;
    if (!alreadyIgnores) await genericUtils.setFlag(actor, 'midi-qol', 'ignoreNearbyFoes', 1);
    let spellLabel = actorUtils.getEquivalentSpellSlotName(actor, effect.flags['chris-premades'].castData.castLevel);
    if (spellLabel) config.spell = {slot: spellLabel};
}
async function early({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'stormSphere');
    if (!effect) return true;
    let targetToken = workflow.targets.first();
    if (!targetToken) return;
    let {templateUuid} = effect.flags['chris-premades'].stormSphere;
    let template = await fromUuid(templateUuid);
    if (!template) return;
    if (!templateUtils.getTokensInTemplate(template).has(targetToken)) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Advantage') + ': ' + effect.name);
}
async function late({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'stormSphere');
    if (!effect) return;
    let {templateUuid, alreadyIgnores, playAnimation} = effect.flags['chris-premades'].stormSphere;
    if (!alreadyIgnores) await genericUtils.setFlag(workflow.actor, 'midi-qol', 'ignoreNearbyFoes', 0);
    if (!playAnimation || !animationUtils.jb2aCheck()) return;
    let template = await fromUuid(templateUuid);
    if (!template) return;
    let targetToken = workflow.targets.first();
    new Sequence().effect().atLocation(template.object).stretchTo(targetToken).file('jb2a.chain_lightning.primary.blue').missed(!workflow.hitTargets.has(targetToken)).play();
}
export let stormSphere = {
    name: 'Storm Sphere',
    version: '1.1.10',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['stormSphere']
            },
            {
                pass: 'preTargeting',
                macro: veryEarly,
                priority: 50,
                activities: ['stormSphereBolt']
            },
            {
                pass: 'attackRollComplete',
                macro: late,
                priority: 50,
                activities: ['stormSphereBolt']
            },
            {
                pass: 'preItemRoll',
                macro: early,
                priority: 50,
                activities: ['stormSphereBolt']
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
export let stormSphereTemplate = {
    name: 'Storm Sphere: Template',
    version: stormSphere.version,
    template: [
        {
            pass: 'turnEnd',
            macro: endTurn,
            priority: 50
        }
    ]
};