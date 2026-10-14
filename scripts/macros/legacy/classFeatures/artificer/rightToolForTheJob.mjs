import {applications, automationUtils, constants, effectUtils, itemUtils, Logging} from '../../../../proxy.mjs';
async function make({macroClass: {identifier, source}, workflow}) {
    const tools = new Set(automationUtils.getConfigValue(workflow.item, 'tools'));
    if (!tools.size) return Logging.addMacroWarning(source, identifier, 'The Right Tool For The Job exited early without any tool choices.');
    const choices = await applications.DialogApp.dialog(
        workflow.item.name,
        'CHRISPREMADES.Macros.Legacy.RightToolForTheJob',
        [['button', constants.toolOptions.filter(o => tools.has(o.value)).map(o => ({
            name: CONFIG.DND5E.tools[o.value].id,
            options: {image: o.image},
            label: o.label
        })), {displayAsRows: true}]],
        'cancel'
    );
    const item = await fromUuid(choices?.buttons);
    if (!item) return Logging.addMacroWarning(source, identifier, 'The Right Tool For The Job exited early due to a declined prompt.');
    const parentEntity = (await effectUtils.createEffects(workflow.actor, [{
        showIcon: 0,
        img: workflow.item.img,
        name: workflow.item.name,
        origin: workflow.item.uuid,
        flags: {
            cat: {identifier},
            dae: {
                activity: workflow.activity.uuid,
                stackable: 'noneName',
                expiryMode: 'delete'
            }
        }
    }]))?.[0];
    if (!parentEntity) return Logging.addMacroWarning(source, identifier, `The Right Tool For The Job failed to create the parent active effect!. (parent actor) ${workflow.actor.uuid}}`);
    const target = workflow.targets.first()?.actor ?? workflow.actor;
    await itemUtils.createItems(target, [item.toObject()], {parentEntity});
}
export const rightToolForTheJob = {
    name: 'The Right Tool For The Job',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: make,
            priority: 50
        }
    ],
    config: {
        tools: {
            default: ['alchemist', 'brewer', 'calligrapher','carpenter', 'cartographer', 'cobbler', 'cook', 'glassblower', 'jeweler', 'leatherworker', 'mason', 'painter', 'potter', 'smith', 'tinker', 'weaver', 'woodcarver'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Tools',
            get options() { return constants.toolOptions; }
        }
    }
};
