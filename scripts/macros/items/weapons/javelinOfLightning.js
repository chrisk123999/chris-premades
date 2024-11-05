import {animationUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../../utils.js';

async function early({workflow}) {
    if (!workflow.item.system.uses.value || !workflow.targets.size) return;
    let selection = await dialogUtils.confirm(workflow.item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: workflow.item.name}));
    if (!selection) return;
    await genericUtils.update(workflow.item, {'system.uses.value': workflow.item.system.uses.value - 1});
    let targetToken = workflow.targets.first();
    let ray = new Ray(workflow.token.center, targetToken.center);
    if (!ray.distance) return;
    let templateData = {
        angle: 0,
        direction: Math.toDegrees(ray.angle),
        distance: canvas.scene.grid.distance * ray.distance / canvas.scene.grid.size,
        x: ray.A.x,
        y: ray.A.y,
        t: 'ray',
        user: game.user,
        fillColor: game.user.color,
        width: 5
    };
    genericUtils.setProperty(workflow, 'chrisPremades.javelinOfLightningUsed', true);
    let [template] = await canvas.scene.createEmbeddedDocuments('MeasuredTemplate', [templateData]);
    let effectData = {
        name: genericUtils.format('CHRISPREMADES.GenericEffects.TemplateEffect', {itemName: workflow.item.name}),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 1,
            turns: 1
        },
        flags: {
            dnd5e: {
                dependents: [{uuid: template.uuid}]
            }
        }
    };
    await genericUtils.sleep(100);
    let tokens = templateUtils.getTokensInTemplate(template);
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck();
    if (playAnimation) {
        new Sequence()
            .effect()
            .atLocation(workflow.token)
            .stretchTo(targetToken)
            .file('jb2a.lightning_bolt.wide.blue')
            .play();
    }
    await effectUtils.createEffect(workflow.actor, effectData);
    let targets = Array.from(tokens).filter(i => i.document.uuid !== workflow.token.document.uuid && i.document.uuid !== targetToken.document.uuid);
    if (!targets.length) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Javelin of Lightning: Bolt', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.JavelinOfLightning.Bolt'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, targets, {killAnim: true});
    genericUtils.updateTargets(workflow.targets);
}
async function damage({workflow}) {
    if (!workflow.chrisPremades?.javelinOfLightningUsed) return;
    await workflowUtils.bonusDamage(workflow, '4d6[lightning]', {damageType: 'lightning'});
}
export let javelinOfLightning = {
    name: 'Javelin of Lightning',
    version: '0.12.70',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
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
    ],
    ddbi: {
        correctedItems: {
            'Javelin of Lightning': {
                system: {
                    uses: {
                        value: 1,
                        max: 1,
                        per: 'dawn',
                        recovery: '',
                        prompt: false
                    }
                }
            }
        }
    }
};