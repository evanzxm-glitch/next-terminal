import {getToken} from "./utils";

export const openTinyWin = function (url, name, width, height) {
    const token = getToken();
    if (token) {
        const separator = url.includes('?') ? '&' : '?';
        url = url + separator + 'X-Auth-Token=' + encodeURIComponent(token);
    }
    const top = (window.screen.availHeight - 30 - height) / 2;
    const left = (window.screen.availWidth - 10 - width) / 2;
    window.open(url, name, `height=${height},innerHeight=${height},width=${width},innerWidth=${width},top='${top},left=${left},status=no,toolbar=no,menubar=no,location=no,resizable=no,scrollbars=0,titlebar=no`);
}