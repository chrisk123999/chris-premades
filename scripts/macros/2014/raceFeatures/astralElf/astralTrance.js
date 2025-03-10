import {DialogApp} from '../../../../applications/dialog.js';
import {dialogUtils, effectUtils, genericUtils} from '../../../../utils.js';
async function use({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'astralTrance');
    if (effect) await genericUtils.remove(effect);
    let toolsArray = Object.entries(CONFIG.DND5E.tools).map(i => [i[0], i[1].id]);
    let tools = {};
    let basePack = game.packs.get('dnd5e.items');
    for (let [key, id] of toolsArray) {
        let name = (await fromUuid(id))?.name;
        if (!name) name = (await basePack?.getDocument(id))?.name;
        if (!name) continue;
        tools[key] = name;
    }
    let nonProfSkills = Object.entries(CONFIG.DND5E.skills).filter(([key, _]) => workflow.actor.system.skills[key].value < 1);
    let skillInput = [
        'selectOption',
        [{
            label: 'DND5E.TraitSkillsPlural.one',
            name: 'skillSelected',
            options: {
                options: nonProfSkills.map(([value, {label}]) => ({value, label}))
            }
        }]
    ];
    // TODO: how the hell can we translate this god I hate weapon & tool proficiencies so goddamn much
    let weaponToolInput = [
        'selectOption',
        [{
            label: 'CHRISPREMADES.Macros.AstralTrance.WeapToolProf',
            name: 'weapToolSelected',
            options: {
                options: Object.keys(CONFIG.DND5E.weaponIds).map(i => ({value: i, label: i.capitalize()})).concat(Object.keys(tools).map(i => ({value: i, label: tools[i]})))
            }
        }]
    ];
    let selection = await DialogApp.dialog(workflow.item.name, 'CHRISPREMADES.Macros.AstralTrance.Which', [skillInput, weaponToolInput], 'okCancel');
    if (!selection?.buttons) return;
    let {skillSelected, weapToolSelected} = selection;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'system.skills.' + skillSelected + '.value',
                mode: 4,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: ['longRest']
            }
        }
    };
    if (Object.keys(CONFIG.DND5E.weaponIds).includes(weapToolSelected)) {
        effectData.changes.push({
            key: 'system.traits.weaponProf.value',
            mode: 2,
            value: weapToolSelected,
            priority: 20
        });
    } else {
        let ability = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.AstralTrance.Ability', Object.values(CONFIG.DND5E.abilities).map(i => [i.label, i.abbreviation]));
        if (!ability) ability = 'int';
        effectData.changes.push({
            key: 'system.tools.' + weapToolSelected + '.prof',
            mode: 0,
            value: 1,
            priority: 20
        }, {
            key: 'system.tools.' + weapToolSelected + '.roll.mode',
            mode: 4,
            value: 0,
            priority: 20
        }, {
            key: 'system.tools.' + weapToolSelected + '.ability',
            mode: 5,
            value: ability,
            priority: 20
        });
    }
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'astralTrance'});
}
export let astralTrance = {
    name: 'Astral Trance',
    version: '1.1.0',
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