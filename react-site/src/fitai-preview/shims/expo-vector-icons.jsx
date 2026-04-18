import React from 'react';

const STROKE_ICON_PATHS = {
  add: ['M12 5v14', 'M5 12h14'],
  'add-circle': ['M12 5v14', 'M5 12h14', 'M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20Z'],
  'add-circle-outline': ['M12 5v14', 'M5 12h14', 'M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20Z'],
  'auto-awesome': ['M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z', 'M18.5 4l.7 2.1L21.3 7l-2.1.9-.7 2.1-.7-2.1-2.1-.9 2.1-.9.7-2.1Z'],
  bookmark: ['M7 4h10v16l-5-3-5 3V4Z'],
  'bookmark-border': ['M7 4h10v16l-5-3-5 3V4Z'],
  'calendar-month': ['M4 6h16v14H4Z', 'M8 2v4', 'M16 2v4', 'M4 10h16'],
  'calendar-today': ['M4 6h16v14H4Z', 'M8 2v4', 'M16 2v4', 'M4 10h16', 'M12 15h.01'],
  'camera-alt': ['M4 8h16v11H4Z', 'M9 6l1-2h4l1 2', 'M12 13a3 3 0 1 0 0-.01Z'],
  check: ['M5 13l4 4L19 7'],
  'check-circle': ['M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20Z', 'M8 12.5l2.5 2.5L16 9.5'],
  'chevron-left': ['M15 18l-6-6 6-6'],
  'chevron-right': ['M9 18l6-6-6-6'],
  'clock-outline': ['M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20Z', 'M12 7v5l3 3'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  'content-copy': ['M9 9h10v11H9Z', 'M5 5h10v2', 'M5 7v10'],
  'delete-outline': ['M6 7h12', 'M9 7V5h6v2', 'M8 7l1 12h6l1-12', 'M10 10v6', 'M14 10v6'],
  east: ['M5 12h14', 'M13 6l6 6-6 6'],
  edit: ['M4 20l4-.7L19 8.3 15.7 5 4.7 16 4 20Z'],
  'emoji-events': ['M8 4h8v3a4 4 0 0 1-8 0V4Z', 'M8 7H6a2 2 0 0 1-2-2V4', 'M16 7h2a2 2 0 0 0 2-2V4', 'M12 11v4', 'M9 20h6', 'M10 15h4'],
  'food-drumstick': ['M8 5a5 5 0 0 1 7 7l-4 4a4 4 0 1 1-6-6l3-3', 'M14 14l4 4', 'M18 18l1 1', 'M16 20l1 1'],
  'fitness-center': ['M4 10v4', 'M7 8v8', 'M10 9v6', 'M14 9v6', 'M17 8v8', 'M20 10v4', 'M10 12h4'],
  'ios-share': ['M12 3v10', 'M8 7l4-4 4 4', 'M5 14v5h14v-5'],
  'light-mode': ['M12 4V2', 'M12 22v-2', 'M4.9 4.9l1.4 1.4', 'M17.7 17.7l1.4 1.4', 'M2 12h2', 'M20 12h2', 'M4.9 19.1l1.4-1.4', 'M17.7 6.3l1.4-1.4', 'M12 17a5 5 0 1 0 0-10a5 5 0 0 0 0 10Z'],
  'menu-book': ['M5 5h8a3 3 0 0 1 3 3v11H8a3 3 0 0 0-3 3V5Z', 'M16 8h3'],
  'more-vert': ['M12 5h.01', 'M12 12h.01', 'M12 19h.01'],
  person: ['M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8Z', 'M5 20a7 7 0 0 1 14 0'],
  'person-outline': ['M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8Z', 'M5 20a7 7 0 0 1 14 0'],
  psychology: ['M9.5 9a2.5 2.5 0 1 1 5 0c0 1.2-.8 1.8-1.5 2.3-.8.6-1.5 1.1-1.5 2.2', 'M12 17h.01', 'M8 5a8 8 0 1 0 8 0'],
  restaurant: ['M7 3v8', 'M9 3v8', 'M7 7h2', 'M15 3v18', 'M13 7h4'],
  'restaurant-menu': ['M4 6h16', 'M7 6V4', 'M12 6V4', 'M17 6V4', 'M7 10v10', 'M12 10v10', 'M17 10v10'],
  schedule: ['M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20Z', 'M12 6v6l4 2'],
  send: ['M22 2L11 13', 'M22 2l-7 20-4-9-9-4 20-7Z'],
  settings: ['M12 8.8a3.2 3.2 0 1 0 0 6.4a3.2 3.2 0 0 0 0-6.4Z', 'M12 2v2.5', 'M12 19.5V22', 'M4.9 4.9l1.8 1.8', 'M17.3 17.3l1.8 1.8', 'M2 12h2.5', 'M19.5 12H22', 'M4.9 19.1l1.8-1.8', 'M17.3 6.7l1.8-1.8'],
  'shoe-print': ['M6 16c0-2 1-4 3-6l2 2c1 1 2 2 2 4H6Z', 'M14 18c0-2 1-3 3-5l2 2c1 1 2 2 2 3h-7Z'],
  'smart-toy': ['M8 8V6l4-2 4 2v2', 'M7 9h10v7H7Z', 'M9.5 12h.01', 'M14.5 12h.01', 'M10 15h4', 'M12 2v2'],
  'tips-and-updates': ['M9 18h6', 'M10 22h4', 'M12 2a6 6 0 0 1 4 10c-1 1.2-2 2.3-2 4H10c0-1.7-1-2.8-2-4A6 6 0 0 1 12 2Z'],
  tune: ['M4 6h8', 'M16 6h4', 'M10 6a2 2 0 1 0 4 0', 'M4 12h4', 'M12 12h8', 'M8 12a2 2 0 1 0 4 0', 'M4 18h10', 'M18 18h2', 'M14 18a2 2 0 1 0 4 0'],
  warning: ['M12 3l9 16H3L12 3Z', 'M12 9v4', 'M12 16h.01'],
  water: ['M12 3c3 4 6 7 6 10a6 6 0 1 1-12 0c0-3 3-6 6-10Z'],
  'water-outline': ['M12 3c3 4 6 7 6 10a6 6 0 1 1-12 0c0-3 3-6 6-10Z'],
  'wb-twilight': ['M6 18a6 6 0 0 1 12 0', 'M8 15a4 4 0 1 1 8 0', 'M12 3v4'],
};

const FILL_ICON_PATHS = {
  'arm-flex': ['M7 14c1-4 3-6 6-6 1.7 0 3 1 3 2.7 0 .7-.2 1.4-.6 2l2.6 2.6c.7.7 1 1.6 1 2.5V20H9c-1.7 0-3-1.3-3-3v-3Z'],
  dumbbell: ['M3 10h2v4H3v-4Zm16 0h2v4h-2v-4ZM6 8h3v8H6V8Zm9 0h3v8h-3V8Zm-5 3h4v2h-4v-2Z'],
  'directions-run': ['M13 4a2 2 0 1 1 0 4a2 2 0 0 1 0-4Zm-2 5 3 1 2-1 1 2-2 1 1 3 3 2-1 2-4-2-1-4-2 2-1 5H7l1-6 3-3Z'],
};

function IconBase({ size = 24, color = 'currentColor', style, name }) {
  const strokePaths = STROKE_ICON_PATHS[name];
  const fillPaths = FILL_ICON_PATHS[name];
  const mergedStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={mergedStyle}
      aria-hidden="true"
    >
      {strokePaths
        ? strokePaths.map((pathValue, index) => (
            <path
              key={`${name}-stroke-${index}`}
              d={pathValue}
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))
        : null}
      {fillPaths
        ? fillPaths.map((pathValue, index) => (
            <path key={`${name}-fill-${index}`} d={pathValue} fill={color} />
          ))
        : null}
      {!strokePaths && !fillPaths ? (
        <>
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill="none" />
          <text
            x="12"
            y="15"
            textAnchor="middle"
            fontSize="8"
            fontFamily="Space Grotesk, sans-serif"
            fill={color}
          >
            {name?.slice(0, 2).toUpperCase() || '?'}
          </text>
        </>
      ) : null}
    </svg>
  );
}

function createIconComponent() {
  return function IconComponent(props) {
    return <IconBase {...props} />;
  };
}

export const MaterialIcons = createIconComponent();
export const MaterialCommunityIcons = createIconComponent();
