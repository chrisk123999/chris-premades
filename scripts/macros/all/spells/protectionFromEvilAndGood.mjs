import {activityUtils, actorUtils, automationUtils, constants, effectUtils, workflowUtils} from '../../../proxy.mjs';
function getConfig(document, key) {
    return automationUtils.getOriginConfigValue(document, key) ?? protectionFromEvilAndGood.config[key].default;
}
async function attacked({document, workflow}) {
    if (!workflow.actor) return;
    if (!getConfig(document, 'creatureTypes').includes(actorUtils.typeOrRace(workflow.actor))) return;
    workflow.tracker.disadvantage.add('protection-from-evil-and-good', document.name);
}
async function save({actor, config, document, options}) {
    const source = workflowUtils.getSaveSource(config);
    if (!source?.activity) return;
    if (!getConfig(document, 'creatureTypes').includes(actorUtils.typeOrRace(source.actor))) return;
    const conditions = getConfig(document, 'conditions');
    if (!activityUtils.getConditions(source.activity).some(condition => conditions.includes(condition))) return;
    const alreadyAffected = actorUtils.getEffects(actor).some(effect => effectUtils.getOriginActivitySync(effect)?.uuid === source.activity.uuid && effectUtils.getConditions(effect).some(condition => conditions.includes(condition)));
    if (alreadyAffected) options.advantage = true;
}
function immune({document, effect}) {
    const conditions = getConfig(document, 'conditions');
    if (!effectUtils.getConditions(effect).some(condition => conditions.includes(condition))) return;
    const sourceActor = effectUtils.getOriginActivitySync(effect)?.actor;
    if (!sourceActor || !getConfig(document, 'creatureTypes').includes(actorUtils.typeOrRace(sourceActor))) return;
    const blocked = value => conditions.includes(String(value).toLowerCase());
    const updates = {
        statuses: [...effect.statuses].filter(status => !blocked(status)),
        'system.changes': effect.system.changes.filter(change => !(constants.statusEffectKeys.includes(change.key) && blocked(change.value)))
    };
    if (effect.flags.cat?.conditions) updates['flags.cat.conditions'] = effect.flags.cat.conditions.filter(condition => !blocked(condition));
    effect.updateSource(updates);
}
export const protectionFromEvilAndGood = {
    name: 'Protection from Evil and Good',
    version: '2.0.4',
    rules: 'all',
    roll: [
        {
            pass: 'targetAttackRollConfig',
            macro: attacked,
            priority: 50
        }
    ],
    save: [
        {
            pass: 'actorSituational',
            macro: save,
            priority: 50
        }
    ],
    effect: [
        {
            pass: 'actorPreCreated',
            macro: immune,
            priority: 50
        }
    ],
    config: {
        creatureTypes: {
            default: ['aberration', 'celestial', 'elemental', 'fey', 'fiend', 'undead'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            category: 'homebrew',
            get options() { return constants.creatureTypeOptions; }
        },
        conditions: {
            default: ['charmed', 'frightened'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.Conditions',
            hint: 'CHRISPREMADES.Macros.All.ProtectionFromEvilAndGood.ConditionsHint',
            category: 'homebrew',
            get options() { return constants.statusOptions; }
        }
    }
};
