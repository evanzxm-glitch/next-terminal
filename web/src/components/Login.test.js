import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {Simulate} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import LoginForm, {withoutRememberMe} from './Login';
import request from '../common/request';
import brandingApi from '../api/branding';

jest.mock('../common/request', () => ({
    post: jest.fn(),
}));

jest.mock('../api/branding', () => ({
    getBranding: jest.fn(),
}));

jest.mock('../dd/prompt-modal/prompt-modal', () => () => null);

describe('login form', () => {
    let container;
    let root;

    beforeAll(() => {
        global.IS_REACT_ACT_ENVIRONMENT = true;
        window.matchMedia = window.matchMedia || (() => ({
            matches: false,
            addListener: () => {},
            removeListener: () => {},
        }));
    });

    beforeEach(async () => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        brandingApi.getBranding.mockResolvedValue({
            name: 'Next Terminal',
            description: '',
        });
        request.post.mockResolvedValue({code: 0});

        await act(async () => {
            root.render(
                <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                    <LoginForm/>
                </MemoryRouter>
            );
        });
    });

    afterEach(async () => {
        await act(async () => {
            root.unmount();
        });
        container.remove();
        jest.clearAllMocks();
    });

    it('does not render a remember-me option', () => {
        expect(container.textContent).not.toContain('保持登录');
    });

    it('always submits a non-remembered login', async () => {
        const username = container.querySelector('input[placeholder="登录账号"]');
        const password = container.querySelector('input[placeholder="登录密码"]');
        const form = container.querySelector('form');

        await act(async () => {
            Simulate.change(username, {target: {value: 'admin'}});
            Simulate.change(password, {target: {value: 'admin'}});
            Simulate.submit(form);
        });

        expect(request.post).toHaveBeenCalledWith('/login', {
            username: 'admin',
            password: 'admin',
            remember: false,
        });
    });

    it('overrides legacy remember-me values', () => {
        expect(withoutRememberMe({
            username: 'admin',
            password: 'admin',
            remember: true,
        })).toEqual({
            username: 'admin',
            password: 'admin',
            remember: false,
        });
    });
});
