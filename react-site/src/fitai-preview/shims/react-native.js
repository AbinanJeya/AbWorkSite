import React from 'react';
import * as RNWeb from 'react-native-web';

export * from 'react-native-web';

export const Modal = ({ children, visible }) => (visible ? children : null);

export const KeyboardAvoidingView = RNWeb.View;

export const RefreshControl = () => null;

export const Alert = {
  alert: () => {},
};

export const Share = {
  share: async () => ({ action: 'sharedAction' }),
};

export const ActionSheetIOS = {
  showActionSheetWithOptions: (_options, callback) => callback?.(0),
};

export const Keyboard = {
  addListener: () => ({ remove: () => {} }),
};

export const PanResponder = RNWeb.PanResponder || {
  create: () => ({ panHandlers: {} }),
};

export const Platform = RNWeb.Platform || {
  OS: 'web',
  select(specification) {
    return specification?.web ?? specification?.default;
  },
};

export default {
  ...RNWeb,
  Modal,
  KeyboardAvoidingView,
  RefreshControl,
  Alert,
  Share,
  ActionSheetIOS,
  Keyboard,
  PanResponder,
  Platform,
};
