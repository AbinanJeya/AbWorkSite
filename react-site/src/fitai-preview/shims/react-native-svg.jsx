import React from 'react';

function normalizeStyle(style) {
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.filter(Boolean));
  }

  return style || {};
}

export default function Svg({ children, style, ...props }) {
  return (
    <svg {...props} style={normalizeStyle(style)}>
      {children}
    </svg>
  );
}

export function Circle(props) {
  return <circle {...props} />;
}
