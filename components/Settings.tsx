import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Switch,
  Linking,
  Modal,
  ScrollView,
} from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useThemeStore } from '@/store/useTheme';
import { Ionicons } from '@expo/vector-icons';

const telegramIcon = require('@/assets/images/telegram.png');
const youtubeIcon = require('@/assets/images/youtube.png');

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function Settings({ visible, onClose }: Props) {
  const C = useThemeStore((s) => s.colors);
  const dark = useThemeStore((s) => s.dark);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.overlay, { backgroundColor: dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.32)' }]} onPress={onClose}>
        <Animated.View entering={SlideInDown.springify().damping(20)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: C.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: C.text5 }]} />

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <Text style={[styles.title, { color: C.text0 }]}>Настройки</Text>

              {/* Theme toggle */}
              <View style={[styles.row, { borderBottomColor: C.sep }]}>
                <Text style={styles.themeIcon}>{dark ? '🌙' : '☀️'}</Text>
                <Text style={[styles.rowLabel, { color: C.text1 }]}>
                  Тёмная тема
                </Text>
                <Switch
                  value={dark}
                  onValueChange={toggle}
                  trackColor={{ false: '#E5E5EA', true: C.green }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* About */}
              <Text style={[styles.sectionLabel, { color: C.text3 }]}>
                О ПРОЕКТЕ
              </Text>

              <View style={[styles.aboutCard, { backgroundColor: C.segBg }]}>
                <Text style={[styles.aboutText, { color: C.text1 }]}>
                  LifeTrack — минималистичный трекер привычек. Отмечай вчерашний день за 5 секунд, смотри свой прогресс на тепловой карте. Без оценок, без стресса — просто делал или не делал.
                </Text>
                <Text style={[styles.aboutText, { color: C.text2, marginTop: 8 }]}>
                  Это MVP — приложение создаётся открыто, вместе с сообществом. Весь процесс разработки идёт в Telegram-канале.
                </Text>
                <Text style={[styles.aboutText, { color: C.text2, marginTop: 8 }]}>
                  Автор — OneZee, инди-разработчик. Делаю то, что нужно мне самому, и делюсь этим с вами.
                </Text>
              </View>

              {/* Feedback */}
              <Text style={[styles.sectionLabel, { color: C.text3 }]}>
                ОБРАТНАЯ СВЯЗЬ
              </Text>

              <Pressable
                style={[styles.row, { borderBottomColor: C.sep }]}
                onPress={() => Linking.openURL('https://t.me/onezee123')}
              >
                <Image source={telegramIcon} style={styles.socialIcon} />
                <View style={styles.rowContent}>
                  <Text style={[styles.rowTitle, { color: C.text1 }]} numberOfLines={1}>
                    Написать автору
                  </Text>
                  <Text style={[styles.rowSub, { color: C.text4 }]}>
                    Баги, идеи, предложения — всё читаю
                  </Text>
                </View>
                <Ionicons name="chatbubble-outline" size={14} color={C.text4} />
              </Pressable>

              {/* Social */}
              <Text style={[styles.sectionLabel, { color: C.text3 }]}>
                ССЫЛКИ
              </Text>

              <Pressable
                style={[styles.row, { borderBottomColor: C.sep }]}
                onPress={() => Linking.openURL('https://t.me/onezee_co')}
              >
                <Image source={telegramIcon} style={styles.socialIcon} />
                <View style={styles.rowContent}>
                  <Text style={[styles.rowTitle, { color: C.text1 }]} numberOfLines={1}>
                    Telegram-канал
                  </Text>
                  <Text style={[styles.rowSub, { color: C.text4 }]}>
                    Разработка LifeTrack в реальном времени
                  </Text>
                </View>
                <Ionicons name="open-outline" size={14} color={C.text4} />
              </Pressable>

              <Pressable
                style={[styles.row, { borderBottomColor: 'transparent' }]}
                onPress={() => Linking.openURL('https://youtube.com/c/OneZee')}
              >
                <Image source={youtubeIcon} style={styles.socialIcon} />
                <View style={styles.rowContent}>
                  <Text style={[styles.rowTitle, { color: C.text1 }]} numberOfLines={1}>
                    YouTube
                  </Text>
                  <Text style={[styles.rowSub, { color: C.text4 }]}>
                    Канал автора
                  </Text>
                </View>
                <Ionicons name="open-outline" size={14} color={C.text4} />
              </Pressable>

              {/* Version */}
              <Text style={[styles.version, { color: C.text5 }]}>
                LifeTrack MVP v0.1.0 — сделано с душой
              </Text>
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  themeIcon: {
    fontSize: 18,
    width: 32,
  },
  socialIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  aboutCard: {
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 20,
  },
});
