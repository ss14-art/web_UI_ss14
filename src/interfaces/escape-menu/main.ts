import { mount } from 'svelte';
import App from './App.svelte';
import './escape-menu.css';

const target = document.getElementById('app');
if (!target) {
    throw new Error('Escape menu mount target is missing.');
}

mount(App, { target });
