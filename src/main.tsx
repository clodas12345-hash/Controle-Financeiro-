import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

// Previne o comportamento padrão de "pull-to-refresh" em dispositivos móveis
let touchStartY = 0;
document.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  const touchY = e.touches[0].clientY;
  const touchDiff = touchY - touchStartY;
  
  // Apenas nos preocupamos com o movimento de puxar para baixo (pull down)
  if (touchDiff > 0) {
    let target = e.target as HTMLElement | null;
    let isScrollable = false;
    let isAtTop = true;

    // Busca o contêiner rolável mais próximo do elemento tocado pela verificação de scrollHeight
    while (target && target !== document.body && target !== document.documentElement) {
      const isContentScrollable = target.scrollHeight > target.clientHeight;
      const isOverflowHidden = target.style.overflow === 'hidden' || target.style.overflowY === 'hidden';
      
      // Se possui conteúdo rolável e não está explicitamente oculto
      if (isContentScrollable && !isOverflowHidden) {
        isScrollable = true;
        isAtTop = target.scrollTop <= 0;
        break;
      }
      target = target.parentElement;
    }

    // Se não há contêiner rolável, ou se há e ele está no topo, bloqueamos o evento
    if (!isScrollable || isAtTop) {
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  }
}, { passive: false });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
