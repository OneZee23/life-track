import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/useTheme';
import { useHabitsStore } from '@/store/useHabits';
import { EMOJIS, MAX_HABITS, HABIT_NAME_LIMIT } from '@/utils/constants';
import type { Habit } from '@/types';
import type { Theme } from '@/utils/constants';

export default function HabitsScreen() {
  const C = useThemeStore((s) => s.colors);
  const habits = useHabitsStore((s) => s.habits);
  const addHabit = useHabitsStore((s) => s.add);
  const updateHabit = useHabitsStore((s) => s.update);
  const removeHabit = useHabitsStore((s) => s.remove);
  const reorderHabits = useHabitsStore((s) => s.reorder);
  const insets = useSafeAreaInsets();

  // Add form
  const [adding, setAdding] = useState(false);
  const [newEmoji, setNewEmoji] = useState('🎯');
  const [newName, setNewName] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Edit form
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed || habits.length >= MAX_HABITS) return;
    await addHabit(trimmed.slice(0, HABIT_NAME_LIMIT), newEmoji);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNewName('');
    setNewEmoji('🎯');
    setAdding(false);
    setShowEmojiPicker(false);
  };

  const handleSave = async () => {
    const trimmed = editName.trim();
    if (!trimmed || !editId) return;
    await updateHabit(editId, {
      name: trimmed.slice(0, HABIT_NAME_LIMIT),
      emoji: editEmoji,
    });
    setEditId(null);
    setShowEditEmojiPicker(false);
  };

  const handleRemove = useCallback((id: string, name: string) => {
    Alert.alert(
      'Удалить привычку?',
      `Вы уверены, что хотите удалить «${name}»? Данные чек-инов сохранятся.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            removeHabit(id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
      ]
    );
  }, [removeHabit]);

  const startEdit = (id: string, name: string, emoji: string) => {
    setEditId(id);
    setEditName(name);
    setEditEmoji(emoji);
    setShowEditEmojiPicker(false);
  };

  const onDragEnd = useCallback(({ from, to }: { from: number; to: number }) => {
    if (from !== to) {
      reorderHabits(from, to);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [reorderHabits]);

  const renderItem = useCallback(({ item: h, drag, isActive, getIndex }: RenderItemParams<Habit>) => {
    const idx = getIndex() ?? 0;
    const isFirst = idx === 0;
    const isLast = idx === habits.length - 1;

    if (editId === h.id) {
      return (
        <View style={[
          styles.editForm,
          { backgroundColor: C.greenLight },
          isFirst && { borderTopLeftRadius: 14, borderTopRightRadius: 14 },
          isLast && { borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
        ]}>
          <View style={styles.formRow}>
            <Pressable
              style={[styles.emojiBtn, { backgroundColor: C.card, borderColor: C.sep }]}
              onPress={() => setShowEditEmojiPicker(!showEditEmojiPicker)}
            >
              <Text style={styles.emojiBtnText}>{editEmoji}</Text>
            </Pressable>
            <View style={styles.inputWrap}>
              <TextInput
                value={editName}
                onChangeText={(t) => setEditName(t.slice(0, HABIT_NAME_LIMIT))}
                style={[styles.input, { backgroundColor: C.bg, borderColor: C.sep, color: C.text1 }]}
                autoFocus
              />
              <Text style={[styles.charCount, { color: C.text4 }]}>
                {editName.length}/{HABIT_NAME_LIMIT}
              </Text>
            </View>
          </View>
          {showEditEmojiPicker && (
            <EmojiGrid
              selected={editEmoji}
              onSelect={(e) => {
                setEditEmoji(e);
                setShowEditEmojiPicker(false);
              }}
              colors={C}
            />
          )}
          <View style={styles.formActions}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: C.green }]}
              onPress={handleSave}
            >
              <Text style={styles.actionBtnTextWhite}>Сохранить</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: C.card, borderWidth: 1, borderColor: C.sep }]}
              onPress={() => setEditId(null)}
            >
              <Text style={[styles.actionBtnText, { color: C.text2 }]}>Отмена</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.habitRow,
            { backgroundColor: C.card },
            isFirst && { borderTopLeftRadius: 14, borderTopRightRadius: 14 },
            isLast && { borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
            isActive && { borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
            !isLast && !isActive && { borderBottomWidth: 0.5, borderBottomColor: C.sep },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.dragHandle}>
            <Ionicons name="menu" size={18} color={C.text5} />
          </View>

          <View style={[styles.habitEmoji, { backgroundColor: C.bg }]}>
            <Text style={styles.habitEmojiText}>{h.emoji}</Text>
          </View>
          <Text style={[styles.habitName, { color: C.text1 }]} numberOfLines={1}>
            {h.name}
          </Text>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: C.segBg }]}
            onPress={() => startEdit(h.id, h.name, h.emoji)}
          >
            <Ionicons name="pencil" size={15} color={C.blue} />
          </Pressable>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: 'rgba(255,59,48,0.1)' }]}
            onPress={() => handleRemove(h.id, h.name)}
          >
            <Ionicons name="close" size={14} color="#FF3B30" />
          </Pressable>
        </Pressable>
      </ScaleDecorator>
    );
  }, [C, editId, editName, editEmoji, showEditEmojiPicker, habits.length, handleRemove]);

  const keyExtractor = useCallback((item: Habit) => item.id, []);

  const ListFooter = useCallback(() => (
    <View style={styles.footer}>
      {adding ? (
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={[styles.addForm, { backgroundColor: C.card }]}
        >
          <Text style={[styles.addFormLabel, { color: C.green }]}>
            Новая привычка
          </Text>
          <View style={styles.formRow}>
            <Pressable
              style={[styles.emojiBtn, { backgroundColor: C.bg, borderColor: C.sep }]}
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Text style={styles.emojiBtnText}>{newEmoji}</Text>
            </Pressable>
            <View style={styles.inputWrap}>
              <TextInput
                value={newName}
                onChangeText={(t) => setNewName(t.slice(0, HABIT_NAME_LIMIT))}
                placeholder="Название"
                placeholderTextColor={C.text4}
                style={[styles.input, { backgroundColor: C.bg, borderColor: C.sep, color: C.text1 }]}
                autoFocus
              />
              <Text style={[styles.charCount, { color: C.text4 }]}>
                {newName.length}/{HABIT_NAME_LIMIT}
              </Text>
            </View>
          </View>
          {showEmojiPicker && (
            <EmojiGrid
              selected={newEmoji}
              onSelect={(e) => {
                setNewEmoji(e);
                setShowEmojiPicker(false);
              }}
              colors={C}
            />
          )}
          <View style={styles.formActions}>
            <Pressable
              style={[
                styles.actionBtn,
                { backgroundColor: newName.trim() ? C.green : C.sep },
              ]}
              onPress={handleAdd}
              disabled={!newName.trim()}
            >
              <Text
                style={[
                  styles.actionBtnTextWhite,
                  { color: newName.trim() ? '#fff' : C.text4 },
                ]}
              >
                Добавить
              </Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: C.card, borderWidth: 1, borderColor: C.sep }]}
              onPress={() => {
                setAdding(false);
                setShowEmojiPicker(false);
                setNewName('');
              }}
            >
              <Text style={[styles.actionBtnText, { color: C.text2 }]}>Отмена</Text>
            </Pressable>
          </View>
        </Animated.View>
      ) : habits.length < MAX_HABITS ? (
        <Pressable
          style={[styles.addBtn, { backgroundColor: C.greenLight }]}
          onPress={() => setAdding(true)}
        >
          <Text style={[styles.addBtnText, { color: C.green }]}>
            + Добавить привычку
          </Text>
        </Pressable>
      ) : (
        <Text style={[styles.maxText, { color: C.text4 }]}>
          Максимум {MAX_HABITS} привычек
        </Text>
      )}
    </View>
  ), [adding, newEmoji, newName, showEmojiPicker, C, habits.length]);

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text0 }]}>Привычки</Text>
          <Text style={[styles.count, { color: C.text3 }]}>
            {habits.length} из {MAX_HABITS}
          </Text>
        </View>

        <DraggableFlatList
          data={habits}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onDragEnd={onDragEnd}
          onDragBegin={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          containerStyle={styles.listContainer}
          contentContainerStyle={styles.content}
          ListFooterComponent={ListFooter}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

function EmojiGrid({
  selected,
  onSelect,
  colors: C,
}: {
  selected: string;
  onSelect: (emoji: string) => void;
  colors: Theme;
}) {
  return (
    <View style={styles.emojiGrid}>
      {EMOJIS.map((e) => (
        <Pressable
          key={e}
          onPress={() => onSelect(e)}
          style={[
            styles.emojiCell,
            {
              borderColor: selected === e ? C.green : C.sep,
              borderWidth: selected === e ? 2 : 1,
              backgroundColor: selected === e ? C.greenLight : C.card,
            },
          ]}
        >
          <Text style={styles.emojiCellText}>{e}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  count: {
    fontSize: 15,
  },
  listContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  footer: {
    marginTop: 12,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingLeft: 8,
    paddingRight: 12,
    gap: 8,
  },
  dragHandle: {
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  habitEmoji: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitEmojiText: {
    fontSize: 20,
  },
  habitName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editForm: {
    padding: 14,
  },
  addForm: {
    borderRadius: 14,
    padding: 14,
  },
  addFormLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiBtnText: {
    fontSize: 22,
  },
  inputWrap: {
    flex: 1,
    position: 'relative',
  },
  input: {
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 50,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  charCount: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -7 }],
    fontSize: 11,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 10,
  },
  emojiCell: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiCellText: {
    fontSize: 20,
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnTextWhite: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  addBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  maxText: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 8,
  },
});
