import React from 'react';

export function useSharedValue(initialValue) {
  const ref = React.useRef({ value: initialValue });
  return ref.current;
}

export function withTiming(nextValue) {
  return nextValue;
}

export function useAnimatedProps(factory) {
  return factory();
}

const Animated = {
  createAnimatedComponent(Component) {
    return React.forwardRef(function AnimatedComponent({ animatedProps, ...props }, ref) {
      return React.createElement(Component, { ref, ...props, ...(animatedProps || {}) });
    });
  },
};

export default Animated;
