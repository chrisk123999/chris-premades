import {DialogApp} from '../../../../applications/dialog.js';
import {animationUtils, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../../../utils.js';

async function early({workflow}) {
    let ki = itemUtils.getItemByIdentifier(workflow.actor, 'ki');
    let augmentBreath = itemUtils.getItemByIdentifier(workflow.actor, 'augmentBreath');
    let classLevel = workflow.actor.classes.monk?.system.levels ?? 1;
    let damageDice = classLevel > 10 ? 3 : 2;
    let buttons = [
        ['DND5E.DamageAcid', 'acid', {image: 'icons/magic/acid/projectile-faceted-glob.webp'}],
        ['DND5E.DamageCold', 'cold', {image: 'icons/magic/air/wind-tornado-wall-blue.webp'}],
        ['DND5E.DamageFire', 'fire', {image: 'icons/magic/fire/beam-jet-stream-embers.webp'}],
        ['DND5E.DamageLightning', 'lightning', {image: 'icons/magic/lightning/bolt-blue.webp'}],
        ['DND5E.DamagePoison', 'poison', {image: 'icons/magic/death/skull-poison-green.webp'}]
    ];
    let inputs = [
        ['selectOption',
            [
                {
                    label: 'DND5E.Type',
                    name: 'shape',
                    options: {
                        options: [
                            {
                                value: 'cone',
                                label: 'CHRISPREMADES.Template.Cone'
                            },
                            {
                                value: 'line',
                                label: 'CHRISPREMADES.Template.Line'
                            }
                        ]
                    }
                },
                {
                    label: 'CHRISPREMADES.Config.DamageType',
                    name: 'damageType',
                    options: {
                        options: buttons.map(i => ({label: i[0], value: i[1]}))
                    }
                }
            ]
        ]
    ];
    if (augmentBreath && ki?.system.uses.value) {
        inputs.push(['checkbox',
            [
                {
                    label: 'CHRISPREMADES.Macros.BreathOfTheDragon.Augment',
                    name: 'augment'
                }
            ]
        ]);
    }
    let selection = await DialogApp.dialog(workflow.item.name, 'CHRISPREMADES.Macros.BreathOfTheDragon.Select', inputs, 'okCancel');
    if (!selection?.buttons) return;
    let {shape, damageType, augment} = selection;
    let parts = genericUtils.duplicate(workflow.item.system.damage.parts);
    let target = genericUtils.duplicate(workflow.item.system.target);
    parts[0][0] = String(damageDice + (augment ? 1 : 0)) + '@scale.monk.die.die[' + damageType + ']';
    parts[0][1] = damageType;
    target.type = shape;
    target.value = augment ? 90 : 30;
    if (shape === 'cone') target.value = 2 * target.value / 3;
    target.units = 'ft';
    if (augment) {
        await augmentBreath.displayCard();
        await genericUtils.update(ki, {'system.uses.value': ki.system.uses.value - 1});
    }
    workflow.item = workflow.item.clone({'system.damage.parts': parts}, {'keepId': true});
    workflow.item.prepareData();
    workflow.item.prepareFinalAttributes();
    workflow.item.applyActiveEffects();
    let templateData = {
        user: game.user,
        t: target.type === 'cone' ? 'cone' : 'ray',
        distance: target.value,
        fillColor: game.user.color,
        flags: {
            dnd5e: {
                origin: workflow.item.uuid
            },
            'midi-qol': {
                originUuid: workflow.item.uuid
            }
        }
    };
    if (target.type === 'line') templateData.width = 5;
    if (target.type === 'cone') templateData.angle = CONFIG.MeasuredTemplate.defaults.angle;
    let {template, tokens} = await templateUtils.placeTemplate(templateData, true);
    genericUtils.updateTargets(tokens);
    workflow.template = template;
    await workflowUtils.handleInstantTemplate(workflow);
    let jb2a = animationUtils.jb2aCheck();
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && jb2a;
    if (!playAnimation) return;
    let file = 'jb2a.breath_weapons.';
    if (shape === 'cone') {
        switch (damageType) {
            case 'acid':
            case 'poison':
                file += 'poison.cone.green';
                break;
            case 'cold':
                file += 'cold.cone.blue';
                break;
            case 'fire':
                file += 'fire.cone.orange.01';
                break;
            case 'lightning':
                if (jb2a !== 'patreon') return;
                file += 'fire.cone.blue.02';
                break;
        }
    } else {
        switch (damageType) {
            case 'acid':
            case 'poison':
                file += 'acid.line.green';
                break;
            case 'fire':
                file += 'fire.line.orange';
                break;
            case 'lightning':
                file += 'lightning.line.blue';
                break;
            case 'cold':
                if (jb2a !== 'patreon') return;
                file += 'fire.line.blue';
                break;  
        }
    }
    new Sequence().effect().file(file).atLocation(template.object.position).stretchTo(template.object).play();
}
export let breathOfTheDragon = {
    name: 'Breath of the Dragon',
    version: '1.0.36',
    midi: {
        item: [
            {
                pass: 'preItemRoll',
                macro: early,
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