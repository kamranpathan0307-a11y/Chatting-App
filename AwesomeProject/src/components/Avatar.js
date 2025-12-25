import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

const Avatar = ({ 
  size = 56, 
  source, 
  initials, 
  online = false,
  style 
}) => {
  const avatarSize = size;
  const fontSize = size * 0.32;

  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }, style]}>
      {source ? (
        <Image 
          source={{ uri: source }} 
          style={[styles.image, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} 
        />
      ) : (
        <View style={[styles.initialsContainer, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
          <Text style={[styles.initials, { fontSize }]}>
            {initials || '?'}
          </Text>
        </View>
      )}
      {online && (
        <View style={[styles.onlineIndicator, { width: avatarSize * 0.25, height: avatarSize * 0.25, borderRadius: avatarSize * 0.125 }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  initialsContainer: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.onlineStatus,
    borderWidth: 2,
    borderColor: colors.background,
  },
});

export default Avatar;

