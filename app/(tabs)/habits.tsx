import { useState, useCallback, useEffect, useMemo, useRef, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import ReorderableList, {
  useReorderableDrag,
  useIsActive,
  type ReorderableListReorderEvent,
} from 'react-native-reorderable-list';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/useTheme';
import { useHabitsStore } from '@/store/useHabits';
import { EMOJIS, MAX_HABITS, HABIT_NAME_LIMIT } from '@/utils/constants';
import type { Habit } from '@/types';
import type { Theme } from '@/utils/constants';
import { useTabBarOverlap } from '@/hooks/useTabBarOverlap';

/* ─── Habit cell (hooks must be called unconditionally) ─── */

interface HabitCellProps {
  habit: Habit;
  index: number;
  habitsCount: number;
  editId: string | null;
  editName: string;
  editEmoji: string;
  showEditEmojiPicker: boolean;
  onEditNameChange: (t: string) => void;
  onEditEmojiToggle: () => void;
  onEditEmojiSelect: (e: string) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onStartEdit: (id: string, name: string, emoji: string) => void;
  onRemove: (id: string, name: string) => void;
}

const HabitCell = memo(function HabitCell({
  habit: h,
  index,
  habitsCount,
  editId,
  editName,
  editEmoji,
  showEditEmojiPicker,
  onEditNameChange,
  onEditEmojiToggle,
  onEditEmojiSelect,
  onSave,
  onCancelEdit,
  onStartEdit,
  onRemove,
}: HabitCellProps) {
  const C = useThemeStore((s) => s.colors);
  const drag = useReorderableDrag();
  const isActive = useIsActive();
  const isFirst = index === 0;
  const isLast = index === habitsCount - 1;
  const isEditing = editId === h.id;

  const activeAnim = useSharedValue(0);
  useEffect(() => {
    activeAnim.value = withTiming(isActive ? 1 : 0, { duration: 150 });
  }, [isActive]);

  const cornerStyle = useAnimatedStyle(() => ({
    borderTopLeftRadius: isFirst ? 14 : 14 * activeAnim.value,
    borderTopRightRadius: isFirst ? 14 : 14 * activeAnim.value,
    borderBottomLeftRadius: isLast ? 14 : 14 * activeAnim.value,
    borderBottomRightRadius: isLast ? 14 : 14 * activeAnim.value,
  }));

  if (isEditing) {
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
            onPress={onEditEmojiToggle}
          >
            <Text style={styles.emojiBtnText}>{editEmoji}</Text>
          </Pressable>
          <View style={styles.inputWrap}>
            <TextInput
              value={editName}
              onChangeText={onEditNameChange}
              style={[styles.input, { backgroundColor: C.bg, borderColor: C.sep, color: C.text1 }]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={onSave}
              blurOnSubmit
            />
            <Text style={[styles.charCount, { color: C.text4 }]}>
              {editName.length}/{HABIT_NAME_LIMIT}
            </Text>
          </View>
        </View>
        {showEditEmojiPicker && (
          <EmojiGrid
            selected={editEmoji}
            onSelect={onEditEmojiSelect}
            colors={C}
          />
        )}
        <View style={styles.formActions}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: C.green }]}
            onPress={onSave}
          >
            <Text style={styles.actionBtnTextWhite}>Сохранить</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: C.card, borderWidth: 1, borderColor: C.sep }]}
            onPress={onCancelEdit}
          >
            <Text style={[styles.actionBtnText, { color: C.text2 }]}>Отмена</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[{ overflow: 'hidden' }, cornerStyle]}>
      <Pressable
        onLongPress={drag}
        delayLongPress={200}
        style={[
          styles.habitRow,
          { backgroundColor: C.card },
          !isLast && !isActive && { borderBottomWidth: 0.5, borderBottomColor: C.sep },
        ]}
      >
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
          onPress={() => onStartEdit(h.id, h.name, h.emoji)}
        >
          <Ionicons name="pencil" size={15} color={C.blue} />
        </Pressable>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: 'rgba(255,59,48,0.1)' }]}
          onPress={() => onRemove(h.id, h.name)}
        >
          <Ionicons name="close" size={14} color="#FF3B30" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
});

/* ─── Main screen ─── */

export default function HabitsScreen() {
  const C = useThemeStore((s) => s.colors);
  const habits = useHabitsStore((s) => s.habits);
  const addHabit = useHabitsStore((s) => s.add);
  const updateHabit = useHabitsStore((s) => s.update);
  const removeHabit = useHabitsStore((s) => s.remove);
  const reorderHabits = useHabitsStore((s) => s.reorder);
  const insets = useSafeAreaInsets();
  const tabOverlap = useTabBarOverlap();

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

  const cancelAdd = useCallback(() => {
    setAdding(false);
    setShowEmojiPicker(false);
    setNewName('');
    Keyboard.dismiss();
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = editName.trim();
    if (!trimmed || !editId) return;
    await updateHabit(editId, {
      name: trimmed.slice(0, HABIT_NAME_LIMIT),
      emoji: editEmoji,
    });
    setEditId(null);
    setShowEditEmojiPicker(false);
  }, [editId, editName, editEmoji, updateHabit]);

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

  const startEdit = useCallback((id: string, name: string, emoji: string) => {
    setEditId(id);
    setEditName(name);
    setEditEmoji(emoji);
    setShowEditEmojiPicker(false);
  }, []);

  const handleReorder = useCallback(({ from, to }: ReorderableListReorderEvent) => {
    reorderHabits(from, to);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [reorderHabits]);

  const handleEditNameChange = useCallback((t: string) => {
    setEditName(t.slice(0, HABIT_NAME_LIMIT));
  }, []);

  const handleEditEmojiToggle = useCallback(() => {
    setShowEditEmojiPicker((prev) => !prev);
  }, []);

  const handleEditEmojiSelect = useCallback((e: string) => {
    setEditEmoji(e);
    setShowEditEmojiPicker(false);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditId(null);
  }, []);

  const renderItem = useCallback(({ item, index }: { item: Habit; index: number }) => (
    <HabitCell
      habit={item}
      index={index}
      habitsCount={habits.length}
      editId={editId}
      editName={editName}
      editEmoji={editEmoji}
      showEditEmojiPicker={showEditEmojiPicker}
      onEditNameChange={handleEditNameChange}
      onEditEmojiToggle={handleEditEmojiToggle}
      onEditEmojiSelect={handleEditEmojiSelect}
      onSave={handleSave}
      onCancelEdit={handleCancelEdit}
      onStartEdit={startEdit}
      onRemove={handleRemove}
    />
  ), [habits.length, editId, editName, editEmoji, showEditEmojiPicker, handleSave, startEdit, handleRemove, handleEditNameChange, handleEditEmojiToggle, handleEditEmojiSelect, handleCancelEdit]);

  const keyExtractor = useCallback((item: Habit) => item.id, []);

  // Footer: only "add" button or max text (form is rendered separately outside list)
  const listFooter = useMemo(() => (
    <View style={styles.footer}>
      {adding ? null : habits.length < MAX_HABITS ? (
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
  ), [adding, C, habits.length]);

  return (
    <View style={[styles.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text0 }]}>Привычки</Text>
        <Text style={[styles.count, { color: C.text3 }]}>
          {habits.length} из {MAX_HABITS}
        </Text>
      </View>

      {/* Habit list */}
      <ReorderableList
        data={habits}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onReorder={handleReorder}
        shouldUpdateActiveItem
        style={styles.listContainer}
        contentContainerStyle={[styles.content, { paddingBottom: tabOverlap + 16 }]}
        ListFooterComponent={listFooter}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      {/* iOS: form below list with KeyboardAvoidingView */}
      {adding && Platform.OS === 'ios' && (
        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={0}
        >
          <AddFormPanel
            C={C}
            newEmoji={newEmoji}
            newName={newName}
            showEmojiPicker={showEmojiPicker}
            onEmojiToggle={() => setShowEmojiPicker(!showEmojiPicker)}
            onEmojiSelect={(e) => { setNewEmoji(e); setShowEmojiPicker(false); }}
            onNameChange={(t) => setNewName(t.slice(0, HABIT_NAME_LIMIT))}
            onAdd={handleAdd}
            onCancel={cancelAdd}
          />
        </KeyboardAvoidingView>
      )}

      {/* Android: Modal — creates a new native window where adjustResize works */}
      {Platform.OS === 'android' && (
        <Modal
          visible={adding}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={cancelAdd}
        >
          <View style={styles.modalContainer}>
            <Pressable style={styles.modalBackdrop} onPress={cancelAdd} />
            <AddFormPanel
              C={C}
              newEmoji={newEmoji}
              newName={newName}
              showEmojiPicker={showEmojiPicker}
              onEmojiToggle={() => setShowEmojiPicker(!showEmojiPicker)}
              onEmojiSelect={(e) => { setNewEmoji(e); setShowEmojiPicker(false); }}
              onNameChange={(t) => setNewName(t.slice(0, HABIT_NAME_LIMIT))}
              onAdd={handleAdd}
              onCancel={cancelAdd}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

/* ─── Add form panel (shared between iOS inline + Android modal) ─── */

function AddFormPanel({
  C,
  newEmoji,
  newName,
  showEmojiPicker,
  onEmojiToggle,
  onEmojiSelect,
  onNameChange,
  onAdd,
  onCancel,
}: {
  C: Theme;
  newEmoji: string;
  newName: string;
  showEmojiPicker: boolean;
  onEmojiToggle: () => void;
  onEmojiSelect: (e: string) => void;
  onNameChange: (t: string) => void;
  onAdd: () => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<TextInput>(null);

  // autoFocus doesn't work reliably inside Android Modal — focus manually
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.addFormPanel, { backgroundColor: C.card, borderTopColor: C.sep }]}>
      <Text style={[styles.addFormLabel, { color: C.green }]}>
        Новая привычка
      </Text>
      <View style={styles.formRow}>
        <Pressable
          style={[styles.emojiBtn, { backgroundColor: C.bg, borderColor: C.sep }]}
          onPress={onEmojiToggle}
        >
          <Text style={styles.emojiBtnText}>{newEmoji}</Text>
        </Pressable>
        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            value={newName}
            onChangeText={onNameChange}
            placeholder="Название"
            placeholderTextColor={C.text4}
            style={[styles.input, { backgroundColor: C.bg, borderColor: C.sep, color: C.text1 }]}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onAdd}
            blurOnSubmit={false}
          />
          <Text style={[styles.charCount, { color: C.text4 }]}>
            {newName.length}/{HABIT_NAME_LIMIT}
          </Text>
        </View>
      </View>
      {showEmojiPicker && (
        <EmojiGrid
          selected={newEmoji}
          onSelect={onEmojiSelect}
          colors={C}
        />
      )}
      <View style={styles.formActions}>
        <Pressable
          style={[
            styles.actionBtn,
            { backgroundColor: newName.trim() ? C.green : C.sep },
          ]}
          onPress={onAdd}
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
          onPress={onCancel}
        >
          <Text style={[styles.actionBtnText, { color: C.text2 }]}>Отмена</Text>
        </Pressable>
      </View>
    </View>
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
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
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
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  addFormPanel: {
    padding: 14,
    paddingHorizontal: 16,
    borderTopWidth: 0.5,
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
