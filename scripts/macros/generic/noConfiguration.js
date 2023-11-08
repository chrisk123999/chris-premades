export async function noConfiguration({speaker, actor, token, character, item, args, scope, workflow}) {
    workflow.options.configureDialog = false;
}