import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '@/api/client';
import { usersApi } from '@/api/users';
import { Avatar } from '@/components/Avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { VikaBrandColors } from '@/components/VikaBrand';
import { MaxContentWidth, MinTouch, Space } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [saving, setSaving] = useState(false);

  const canSave = !!fullName.trim() && !!phone.trim();

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const updated = await usersApi.updateMe({
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
      });
      updateUser(updated);
      toast.success(t('profile.updateSuccess'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profile.updateFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.flex}>
      <View style={[styles.hero, { paddingTop: insets.top + Space.md }]}>
        <View style={styles.heroTop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
          <ThemedText type="heading" style={styles.heroTitle}>
            {t('profile.editProfile')}
          </ThemedText>
        </View>
        <ThemedText type="small" style={styles.heroSubtitle}>
          {t('profile.editProfileSubtitle')}
        </ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarRow}>
          <Avatar name={user?.fullName} size={72} />
        </View>

        <TextField
          label={t('profile.fullNameLabel')}
          leftIcon="person-outline"
          textContentType="name"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextField
          label={t('profile.phoneLabel')}
          leftIcon="call-outline"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          value={phone}
          onChangeText={setPhone}
        />
        <TextField
          label={t('profile.addressLabel')}
          leftIcon="location-outline"
          placeholder={t('profile.addressPlaceholder')}
          value={address}
          onChangeText={setAddress}
        />

        <Button label={t('profile.saveChanges')} onPress={handleSave} loading={saving} disabled={!canSave} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    backgroundColor: VikaBrandColors.navy,
    paddingHorizontal: Space.lg,
    paddingBottom: Space.xl,
    gap: Space.xs,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  backButton: {
    width: MinTouch,
    height: MinTouch,
    marginLeft: -Space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { color: '#FFFFFF' },
  heroSubtitle: { color: 'rgba(255,255,255,0.75)', marginLeft: MinTouch - Space.sm },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Space.lg,
    gap: Space.lg,
    paddingBottom: Space['4xl'],
  },
  avatarRow: { alignItems: 'center', marginBottom: Space.sm },
});
