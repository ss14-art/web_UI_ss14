import { mount } from 'svelte';
import App from './App.svelte';
import './lobby.css';

mount(App, { target: document.getElementById('app')! });
