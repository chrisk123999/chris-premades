import {compendiumUtils, constants, effectUtils, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let useRealDarkness = itemUtils.getConfig(workflow.item, 'useRealDarkness');
    let darknessAnimation = itemUtils.getConfig(workflow.item, 'darknessAnimation');
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
                    template: ['hungerOfHadarTemplate']
                }
            },
            walledtemplates: {
                wallRestriction: 'move',
                wallsBlock: 'walled'
            }
        }
    });
    if (useRealDarkness) {
        let [darknessSource] = await genericUtils.createEmbeddedDocuments(template.parent, 'AmbientLight', [{config: {negative: true, dim: template.distance, animation: {type: darknessAnimation}}, x: template.x, y: template.y}]);
        effectUtils.addDependent(template, [darknessSource]);
    }
    let targets = templateUtils.getTokensInTemplate(template);
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: template.uuid,
        flags: {
            'chris-premades': {
                conditions: ['blinded']
            }
        }
    };
    for (let target of targets) await effectUtils.createEffect(target.actor, effectData, {parentEntity: template, identifier: 'hungerOfHadarBlinded'});
}
async function startTurn({trigger: {entity: template, token}}) {
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Hunger of Hadar: Cold', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.HungerOfHadar.Cold'});
    let sourceActor = (await templateUtils.getSourceActor(template)) ?? token.actor;
    await workflowUtils.syntheticItemDataRoll(featureData, sourceActor, [token]);
}
async function endTurn({trigger: {entity: template, castData, token}}) {
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Hunger of Hadar: Tentacles', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.HungerOfHadar.Tentacles', flatDC: castData.saveDC});
    let sourceActor = (await templateUtils.getSourceActor(template)) ?? token.actor;
    await workflowUtils.syntheticItemDataRoll(featureData, sourceActor, [token]);
}
async function enter({trigger: {entity: template, token}}) {
    let originItem = await fromUuid(template.flags.dnd5e?.origin);
    let effectData = {
        name: originItem?.name ?? templateUtils.getName(template),
        img: originItem?.img ?? 'icons/magic/water/barrier-ice-shield.webp',
        origin: template.uuid,
        flags: {
            'chris-premades': {
                conditions: ['blinded']
            }
        }
    };
    await effectUtils.createEffect(token.actor, effectData, {parentEntity: template, identifier: 'hungerOfHadarBlinded'});
}
async function left({trigger: {entity: template, token}}) {
    let effect = effectUtils.getAllEffectsByIdentifier(token.actor, 'hungerOfHadarBlinded').find(i => i.origin === template.uuid);
    if (effect) await genericUtils.remove(effect);
}
export let hungerOfHadar = {
    name: 'Hunger of Hadar',
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
            value: 'useRealDarkness',
            label: 'CHRISPREMADES.Config.RealDarkness',
            type: 'checkbox',
            default: false,
            category: 'mechanics'
        },
        {
            value: 'darknessAnimation',
            label: 'CHRISPREMADES.Config.DarknessAnimation',
            type: 'select',
            default: null,
            options: [
                {
                    label: 'DND5E.None',
                    value: null
                },
                ...Object.entries(CONFIG.Canvas.darknessAnimations).flatMap(i => ({label: i[1].label, value: i[0]}))
            ],
            category: 'mechanics'
        }
    ]
};
export let hungerOfHadarTemplate = {
    name: 'Hunger of Hadar: Template',
    version: hungerOfHadar.version,
    template: [
        {
            pass: 'turnStart',
            macro: startTurn,
            priority: 50
        },
        {
            pass: 'turnEnd',
            macro: endTurn,
            priority: 50
        },
        {
            pass: 'enter',
            macro: enter,
            priority: 50
        },
        {
            pass: 'left',
            macro: left,
            priority: 50
        }
    ]
};