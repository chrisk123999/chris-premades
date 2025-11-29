import {activityUtils, compendiumUtils, effectUtils, genericUtils, itemUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let identifier = activityUtils.getIdentifier(workflow.activity);
    if (!identifier) return;
    let spellList = {
        arctic: [
            'Grease',
            'Hold Person',
            'Slow',
            'Ice Storm',
            'Cone of Cold'
        ],
        coast: [
            'Thunderwave',
            'Mirror Image',
            'Call Lightning',
            'Control Water',
            'Conjure Elemental'
        ],
        desert: [
            'Color Spray',
            'Blur',
            'Daylight',
            'Blight',
            'Seeming'
        ],
        forest: [
            'Entangle',
            'Barkskin',
            'Conjure Animals',
            'Shape Plants',
            'Tree Stride'
        ],
        grassland: [
            'Elevated Sight',
            'Gust of Wind',
            'Wind Wall',
            'Freedom of Movement',
            'Commune with Nature'
        ],
        mountain: [
            'Fog Cloud',
            'Silence',
            'Sleet Storm',
            'Stoneskin',
            'Wall of Stone'
        ],
        swamp: [
            'Veil of Dusk',
            'Spike Growth',
            'Stinking Cloud',
            'Giant Insect',
            'Insect Plague'
        ]
    };
    let spellCompendium = genericUtils.getCPRSetting('spellCompendium');
    if (!game.packs.get(spellCompendium)) return;
    let classIdentifier = itemUtils.getConfig(workflow.item, 'classIdentifier');
    let levels = workflow.actor.classes[classIdentifier]?.system?.levels;
    if (!levels) return;
    let maxLevel = Math.min(9, Math.ceil(levels / 2));
    let spellDatas = (await Promise.all(spellList[identifier].map(async name => {
        let data = await compendiumUtils.getItemFromCompendium(spellCompendium, name, {object: true, rules: genericUtils.getRules(workflow.item)});
        if (!data) return;
        if (data.system.level > maxLevel) return;
        genericUtils.setProperty(data, 'system.method', 'spell');
        genericUtils.setProperty(data, 'system.prepared', 2);
        genericUtils.setProperty(data, 'flags.chris-premades.naturalAttunement.leyline', true);
        return data;
    }))).filter(i => i);
    if (!spellDatas.length) return;
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'naturalAttunementEffect');
    if (effect) await genericUtils.remove(effect);
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    genericUtils.setProperty(effectData, 'flags.chris-premades.naturalAttunement', identifier);
    effect = await effectUtils.createEffect(workflow.actor, effectData);
    await itemUtils.createItems(workflow.actor, spellDatas, {parentEntity: effect, section: workflow.item.name});
}
export let naturalAttunement = {
    name: 'Natural Attunement',
    version: '1.3.149',
    rules: 'legacy',
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
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'wizard',
            category: 'homebrew',
            homebrew: true
        }
    ]
};