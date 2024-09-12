import {DialogApp} from '../../../applications/dialog.js';
import {dialogUtils, effectUtils, genericUtils} from '../../../utils.js';

async function use({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'astralTrance');
    if (effect) await genericUtils.remove(effect);
    let tools = {
        'alchemist': 'Alchemist\'s Supplies',
        'brewer': 'Brewer\'s Supplies',
        'calligrapher': 'Calligrapher\'s Supplies',
        'carpenter': 'Carpenter\'s Tools',
        'cartographer': 'Cartographer\'s Tools',
        'cobbler': 'Cobbler\'s Tools',
        'cook': 'Cook\'s Utensils',
        'glassblower': 'Glassblower\'s Tools',
        'jeweler': 'Jeweler\'s Tools',
        'leatherworker': 'Leatherworker\'s Tools',
        'mason': 'Mason\'s Tools',
        'painter': 'Painter\'s Supplies',
        'potter': 'Potter\'s Tools',
        'smith': 'Smith\'s Tools',
        'tinker': 'Tinker\'s Tools',
        'weaver': 'Weaver\'s Tools',
        'woodcarver': 'Woodcarver\'s Tools',
        'disg': 'Disguise Kit',
        'forg': 'Forgery Kit',
        'herb': 'Herbalism Kit',
        'navg': 'Navigator\'s Tools',
        'pois': 'Poisoner\'s Kit',
        'thief': 'Thieves\' Tools'
    };
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
    let updates;
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
        updates = {['system.tools.' + weapToolSelected]: {ability, value: 1}};
        let old = genericUtils.getProperty(workflow.actor, 'system.tools.' + weapToolSelected);
        genericUtils.setProperty(effectData, 'flags.chris-premades.astralTrance', {
            weapToolSelected,
            old
        });
        effectUtils.addMacro(effectData, 'effect', ['astralTrance']);
    }
    if (updates) await genericUtils.update(workflow.actor, updates);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'astralTrance'});
}
async function end({trigger: {entity: effect}}) {
    let astralFlags = effect.flags['chris-premades'].astralTrance;
    if (!astralFlags) return;
    let actor = effect.parent;
    if (!actor) return;
    let tool = astralFlags.weapToolSelected;
    let old = astralFlags.old;
    if (!tool) return;
    let updatePath = old ? ('system.tools.' + tool) : ('system.tools.-=' + tool);
    await genericUtils.update(actor, {[updatePath]: old ?? null});
}
export let astralTrance = {
    name: 'Astral Trance',
    version: '0.12.64',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ]
};