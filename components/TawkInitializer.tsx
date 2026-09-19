'use client';

import React, { useEffect } from 'react';
import { useApp } from '@/lib/store';

declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
      minimize?: () => void;
      toggle?: () => void;
      hideWidget?: () => void;
      showWidget?: () => void;
      isChatMinimized?: () => boolean;
      isChatMaximized?: () => boolean;
      onLoad?: () => void;
      visitor?: {
        name?: string;
        email?: string;
        hash?: string;
      };
      [key: string]: any;
    };
    Tawk_LoadStart?: Date;
  }
}

export const TawkInitializer: React.FC = () => {
  const { user } = useApp();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    window.Tawk_API.onLoad = function() {
      if (typeof window.Tawk_API?.hideWidget === 'function') {
        window.Tawk_API.hideWidget();
      }
      if (user && window.Tawk_API) {
        window.Tawk_API.visitor = {
          name: user.username || user.email,
          email: user.email,
        };
      }
    };

    if (!document.getElementById('tawkto-script')) {
      const s1 = document.createElement('script');
      s1.id = 'tawkto-script';
      s1.async = true;
      s1.src = 'https://embed.tawk.to/6aacb0d36ebfd6344e772c16/default';
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');

      const s0 = document.getElementsByTagName('script')[0];
      if (s0 && s0.parentNode) {
        s0.parentNode.insertBefore(s1, s0);
      } else {
        document.head.appendChild(s1);
      }
    } else {
      if (window.Tawk_API && user) {
        window.Tawk_API.visitor = {
          name: user.username || user.email,
          email: user.email,
        };
      }
    }
  }, [user]);

  return null;
};
