import {DialogApp} from '../../../../../applications/dialog.js';
import {combatUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../../utils.js';
async function attack({trigger: {entity: item}, workflow}) {
    if (!combatUtils.combatStarted()) return;
    if (!combatUtils.perTurnCheck(item, 'perfectWeapon', true, workflow.token.id)) return;
    let activeGhaalShaarat = await fromUuid(workflow.actor.flags['chris-premades']?.activeGhaalShaarat);
    if (activeGhaalShaarat?.parent.uuid !== workflow.item.uuid) return;
    let originalBonus = activeGhaalShaarat.parent.system.magicalBonus ?? 0;
    if (!originalBonus) return;
    await combatUtils.setTurnCheck(item, 'perfectWeapon');
    let bonus = parseInt(await dialogUtils.selectDialog(item.name, '', {
        label: 'CHRISPREMADES.Macros.PerfectWeapon.TransferBonus',
        name: 'transferBonus',
        options: {
            options: Array(originalBonus).fill().map((_, i) => ({label: 'DND5E.NUMBER.' + (i + 1), value: String(i + 1)}))
        }
    }));
    if (!bonus) return;
    let effectData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        changes: [
            {
                key: 'system.attributes.ac.bonus',
                value: bonus,
                mode: 2,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: ['turnStart']
            }
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'perfectWeaponAC', rules: 'modern'});
    let enchantmentData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        changes: [
            {
                key: 'system.magicalBonus',
                value: originalBonus - bonus,
                mode: 5,
                priority: 20
            }
        ]
    };
    await itemUtils.enchantItem(activeGhaalShaarat.parent, enchantmentData, {identifier: 'perfectWeaponOverride', parentEntity: effect, strictlyInterdependent: true});    
    workflow.item = activeGhaalShaarat.parent;
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size) return;
    let activeGhaalShaarat = await fromUuid(workflow.actor.flags['chris-premades']?.activeGhaalShaarat);
    if (activeGhaalShaarat?.parent.uuid !== workflow.item.uuid) return;
    let {damageType, replace} = item.flags['chris-premades']?.perfectWeaponChoices ?? {};
    let remember = itemUtils.getConfig(item, 'remember');
    let formula = itemUtils.getConfig(item, 'formula');
    if (!remember || !damageType || replace === undefined) {
        let damageOptions = itemUtils.getConfig(item, 'damageTypes');
        let defaultType = damageType || damageOptions[0];
        damageOptions = damageOptions.map(d => {
            let image = constants.damageIcons[d] ?? 'icons/magic/symbols/question-stone-yellow.webp';
            return {label: CONFIG.DND5E.damageTypes[d].label, name: d, options: {image, isChecked: d === defaultType}};
        });
        damageOptions.push({label: 'CHRISPREMADES.Generic.No', name: 'no', options: {image: constants.damageIcons.no, isChecked: defaultType === 'no'}});
        let inputs = [
            ['radio', damageOptions, {displayAsRows: true, radioName: 'damageType'}],
            [
                'checkbox',
                [
                    {label: 'CHRISPREMADES.Macros.PactOfTheBlade.ReplaceDamage', name: 'replace', options: {isChecked: replace}},
                    {label: 'CHRISPREMADES.Config.Remember', name: 'remember', options: {isChecked: remember}}
                ],
                {displayAsRows: true}
            ]
        ];
        let selection = await DialogApp.dialog(
            item.name, 
            genericUtils.format('CHRISPREMADES.Dialog.UseWeaponDamageExtra', {itemName: item.name, bonusFormula: formula}), 
            inputs, 
            'okCancel', 
            {width: 400}
        );
        if (!selection || !selection.buttons) return;
        let updates = {};
        if (selection.damageType !== damageType) genericUtils.setProperty(updates, 'flags.chris-premades.perfectWeaponChoices.damageType', selection.damageType);
        if (selection.replace !== replace) genericUtils.setProperty(updates, 'flags.chris-premades.perfectWeaponChoices.replace', !!selection.replace);
        if (selection.remember !== remember) genericUtils.setProperty(updates, 'flags.chris-premades.config.remember', !!selection.remember);
        if (Object.keys(updates).length) await genericUtils.update(item, updates);
        ({damageType, replace} = selection);
    }
    if (!damageType || damageType === 'no') return;
    if (replace) for (let i = 0; i < workflow.activity.damage.parts.length; i++) {
        workflow.damageRolls[i].options.type = damageType;
    }
    await workflowUtils.bonusDamage(workflow, formula, {damageType});
    await item.displayCard();
}
async function reset({trigger: {entity: item}}) {
    await combatUtils.setTurnCheck(item, 'perfectWeapon', true);
    let transferAC = effectUtils.getEffectByIdentifier(item.parent, 'perfectWeaponAC');
    if (transferAC) await genericUtils.remove(transferAC);
    if (!itemUtils.getConfig(item, 'clearRemember')) return;
    await genericUtils.unsetFlag(item, 'chris-premades', 'perfectWeaponChoices');
}
export let perfectWeapon = {
    name:'Perfect Weapon',
    version: '1.5.21',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: attack,
                priority: 100
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 100
            }
        ]
    },
    combat: [
        {
            pass: 'combatStart',
            macro: reset,
            priority: 100
        },
        {
            pass: 'combatEnd',
            macro: reset,
            priority: 100
        }
    ],
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['acid', 'cold', 'fire', 'lightning', 'thunder'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.DamageBonus',
            type: 'text',
            default: '1d6',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'remember',
            label: 'CHRISPREMADES.Config.Remember',
            type: 'checkbox',
            default: false,
            category: 'mechanics'
        },
        {
            value: 'clearRemember',
            label: 'CHRISPREMADES.Config.Clear',
            type: 'checkbox',
            default: true,
            category: 'mechanics'
        }
    ]
};
