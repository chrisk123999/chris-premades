function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export let helpers = {
    sleep
};