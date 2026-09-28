import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { fonts, radius, space, usePalette } from '@/theme';

import type { IconName } from './primitives';
import { Text } from './Text';

export const Field = forwardRef<TextInput, TextInputProps & { label: string; icon: IconName; secure?: boolean }>(
  function Field({ label, icon, secure, style, ...rest }, ref) {
    const p = usePalette();
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(!!secure);
    return (
      <View style={{ gap: 6 }}>
        <Text variant="label" tone="muted">
          {label}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.sm,
            height: 50,
            paddingHorizontal: space.md,
            borderRadius: radius.md,
            backgroundColor: p.surface,
            borderWidth: 1.5,
            borderColor: focused ? p.primary : p.border,
            boxShadow: focused ? `0px 0px 0px 4px ${p.primary}1F` : undefined,
          }}>
          <Ionicons name={icon} size={18} color={focused ? p.primary : p.textFaint} />
          <TextInput
            ref={ref}
            {...rest}
            secureTextEntry={hidden}
            onFocus={(e) => {
              setFocused(true);
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              rest.onBlur?.(e);
            }}
            placeholderTextColor={p.textFaint}
            style={[
              {
                flex: 1,
                height: '100%',
                color: p.text,
                fontFamily: fonts.medium,
                fontSize: 15,
                outlineStyle: 'none',
              } as object,
              style,
            ]}
          />
          {secure ? (
            <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
              <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={19} color={p.textFaint} />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }
);
