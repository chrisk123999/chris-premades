import {dialogUtils, effectUtils, genericUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!workflow.targets.size) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    for (let targetToken of workflow.targets) {
        let targetActor = targetToken.actor;
        let input = {
            label: 'DND5E.Skill',
            name: 'skillSelected',
            options: {
                options: Object.entries(CONFIG.DND5E.skills).filter(([key, _]) => targetActor.system.skills[key].value == 1).map(([value, {label}]) => {return {value, label};})
            }
        };
        let selection = await dialogUtils.selectDialog(workflow.item.name, 'CHRISPREMADES.Macros.SkillEmpowerment.SelectSkill', input);
        if (!selection) continue;
        let effectData = {
            name: workflow.item.name,
            img: workflow.item.img,
            origin: workflow.item.uuid,
            duration: {
                seconds: 3600 * workflow.item.system.duration.value
            },
            changes: [
                {
                    key: 'system.skills.' + selection + '.value',
                    mode: 4,
                    value: 2,
                    priority: 20
                }
            ]
        };
        let effect = effectUtils.getEffectByIdentifier(targetActor, 'skillEmpowerment');
        if (effect) await genericUtils.remove(effect);
        await effectUtils.createEffect(targetActor, effectData, {concentrationItem: workflow.item, interdependent: true, identifier: 'skillEmpowerment'});
    }
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': 3600 * workflow.item.system.duration.value});
}
export let skillEmpowerment = {
    name: 'Skill Empowerment',
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