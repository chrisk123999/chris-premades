import {automationUtils, dialogUtils, summonUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function early({document: item, workflow, token}) {
    if (workflow.item?.type !== 'spell') return;
    if (!workflow.targets.some(target => target.document.uuid === token.uuid)) return;
    const companionToken = summonUtils.getSummonsByIdentifier('primalCompanion', {actor: workflow.actor})[0]?.token;
    if (!companionToken) return;
    if (tokenUtils.getDistance(token, companionToken) > automationUtils.getConfigValue(item, 'range')) return;
    if (!await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.Modern.ShareSpells.Confirm', {spell: workflow.item.name, name: companionToken.name}))) return;
    await workflowUtils.updateTargets(workflow, [...Array.from(workflow.targets, target => target.document), companionToken]);
}
export const shareSpells = {
    name: 'Share Spells',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {
            pass: 'actorTargeting',
            macro: early,
            priority: 250
        }
    ],
    config: {
        range: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'homebrew'
        }
    }
};
