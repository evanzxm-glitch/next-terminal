import {getHeaders, getToken, setToken} from './utils';

describe('login token storage', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it('stores the token only for the browser session', () => {
        localStorage.setItem('X-Auth-Token', 'legacy-token');

        setToken('session-token');

        expect(sessionStorage.getItem('X-Auth-Token')).toBe('session-token');
        expect(localStorage.getItem('X-Auth-Token')).toBeNull();
        expect(getToken()).toBe('session-token');
        expect(getHeaders()).toEqual({'X-Auth-Token': 'session-token'});
    });

    it('does not restore a legacy persistent token', () => {
        localStorage.setItem('X-Auth-Token', 'legacy-token');

        expect(getToken()).toBeNull();
        expect(localStorage.getItem('X-Auth-Token')).toBeNull();
    });
});
