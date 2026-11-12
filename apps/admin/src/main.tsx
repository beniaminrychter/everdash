import { render } from 'preact';
import { AdminApp } from './ui/AdminApp';
import './index.css';

const root = document.querySelector('#root');

if (root) {
  render(<AdminApp />, root);
}
