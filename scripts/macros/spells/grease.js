import {actorUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let template = workflow.template;
    if (!template) return;
    await genericUtils.update(template, {
        flags: {
            'chris-premades': {
                template: {
                    name: workflow.item.name
                },
                castData: {...workflow.castData, saveDC: itemUtils.getSaveDC(workflow.item)},
                macros: {
                    template: ['greaseArea']
                }
            }
        }
    });
}
async function enterOrEnd({trigger: {entity: template, castData, token}}) {
    if (actorUtils.checkTrait(token.actor, 'ci', 'prone')) return;
    if (effectUtils.getEffectByStatusID(token.actor, 'prone')) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Grease: Fall', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Grease.Fall', flatDC: castData.saveDC});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let sourceActor = (await templateUtils.getSourceActor(template)) ?? token.actor;
    await workflowUtils.syntheticItemDataRoll(featureData, sourceActor, [token]);
}
export let grease = {
    name: 'Grease',
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
export let greaseArea = {
    name: 'Grease: Area',
    version: grease.version,
    template: [
        {
            pass: 'enter',
            macro: enterOrEnd,
            priority: 50
        },
        {
            pass: 'turnEnd',
            macro: enterOrEnd,
            priority: 50
        }
    ]
};