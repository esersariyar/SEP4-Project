import * as React from 'react';

declare global {
  namespace JSX {
    interface Element extends React.ReactElement {}
  }
}

// Type definitions for react-icons
declare module 'react-icons/fa' {
  export * from 'react-icons/fa/index';
}

declare module 'react-icons/md' {
  export * from 'react-icons/md/index';
}

declare module 'react-icons/bs' {
  export * from 'react-icons/bs/index';
}

declare module 'react-icons/io5' {
  export * from 'react-icons/io5/index';
} 