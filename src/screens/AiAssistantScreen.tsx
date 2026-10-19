// 🤖 AI Emergency Assistant Screen - NVIDIA NIM LLM Powered
// Emergency triage, voice STT/TTS with mute control, CPR metronome, aur Sector 128 hospital recommendations

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  ArrowLeft,
  Send,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  HeartPulse,
  StopCircle,
  RefreshCw,
  Zap,
} from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useChatStore } from '../store/useChatStore';
import { useBookingStore } from '../store/useBookingStore';
import { ChatBubble } from '../components/ai/ChatBubble';
import { Hospital } from '../services/mockDataService';
import { soundService } from '../services/soundService';
import { EtherealOrb } from '../components/common/EtherealOrb';

export const AiAssistantScreen: React.FC = () => {
  const { messages, isLoading, quickPrompts, sendMessage, resetChat } = useChatStore();
  const { pickupLocation, setSelectedHospital, confirmBookingAndSearch, setCurrentScreen } = useBookingStore();

  const [inputVal, setInputVal] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(false); // 🔇 Muted by default as requested!
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [metronomeCount, setMetronomeCount] = useState(0);
  const [metronomeVisualPulse, setMetronomeVisualPulse] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);

    // 🔇 Speak ONLY if user explicitly enabled voice output
    const lastMsg = messages[messages.length - 1];
    if (isVoiceOutputEnabled && lastMsg && lastMsg.sender === 'assistant' && lastMsg.text) {
      soundService.speakText(lastMsg.text);
    }
  }, [messages, isLoading, isVoiceOutputEnabled]);

  // Clean up CPR metronome and speech on unmount
  useEffect(() => {
    return () => {
      soundService.stopCprMetronome();
      soundService.stopSpeech();
    };
  }, []);

  const toggleVoiceOutput = () => {
    if (isVoiceOutputEnabled) {
      soundService.stopSpeech();
      setIsVoiceOutputEnabled(false);
    } else {
      setIsVoiceOutputEnabled(true);
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.sender === 'assistant' && lastMsg.text) {
        soundService.speakText(lastMsg.text);
      }
    }
  };

  const toggleMetronome = () => {
    if (isMetronomeActive) {
      soundService.stopCprMetronome();
      setIsMetronomeActive(false);
      setMetronomeCount(0);
    } else {
      setIsMetronomeActive(true);
      setMetronomeCount(1);
      soundService.startCprMetronome(() => {
        setMetronomeCount((prev) => prev + 1);
        setMetronomeVisualPulse(true);
        setTimeout(() => setMetronomeVisualPulse(false), 120);
      });
    }
  };

  const handleVoiceInput = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice STT is not supported on this browser. Please type your message.');
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputVal(transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    if (!inputVal.trim()) return;
    const text = inputVal;
    setInputVal('');
    sendMessage(text, pickupLocation.latitude, pickupLocation.longitude);
  };

  const handleQuickPrompt = (promptText: string) => {
    sendMessage(promptText, pickupLocation.latitude, pickupLocation.longitude);
  };

  const handleDirectBookFromAi = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    confirmBookingAndSearch();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* 🤖 Header with Glowing Ethereal AI Avatar & Mute/Unmute Toggle */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.8}
            onPress={() => {
              soundService.stopSpeech();
              setCurrentScreen('home');
            }}
          >
            <ArrowLeft size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <EtherealOrb size={40}>
            <Sparkles size={18} color="#FFFFFF" />
          </EtherealOrb>

          <View style={styles.headerTitleCol}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.headerTitle}>SavLife Medical AI</Text>
              <View style={styles.liveAiBadge}>
                <Sparkles size={9} color="#FFFFFF" />
                <Text style={styles.liveAiBadgeText}>NVIDIA NIM</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>24/7 Triage & Medical First-Aid</Text>
          </View>

          {/* 🔇 Mute / Unmute AI Speech Toggle */}
          <TouchableOpacity
            style={[styles.muteBtn, isVoiceOutputEnabled && styles.muteBtnActive]}
            activeOpacity={0.8}
            onPress={toggleVoiceOutput}
          >
            {isVoiceOutputEnabled ? (
              <Volume2 size={16} color="#FFFFFF" />
            ) : (
              <VolumeX size={16} color={COLORS.textSecondary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetBtn}
            activeOpacity={0.8}
            onPress={resetChat}
          >
            <RefreshCw size={15} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* 💓 CPR Metronome Live Emergency Tool */}
        <View
          style={[
            styles.metronomeBanner,
            isMetronomeActive && styles.metronomeBannerActive,
            metronomeVisualPulse && styles.metronomeFlash,
          ]}
        >
          <View style={styles.metronomeLeft}>
            <HeartPulse
              size={22}
              color={isMetronomeActive ? '#FFFFFF' : COLORS.alertRed}
            />
            <View>
              <Text
                style={[
                  styles.metronomeTitle,
                  isMetronomeActive && { color: '#FFFFFF' },
                ]}
              >
                {isMetronomeActive ? `CPR Metronome: ${metronomeCount} Compressions (110 BPM)` : 'Emergency CPR Metronome'}
              </Text>
              <Text
                style={[
                  styles.metronomeSub,
                  isMetronomeActive && { color: 'rgba(255,255,255,0.9)' },
                ]}
              >
                Push hard & fast 5cm deep in chest center
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.metronomeBtn,
              isMetronomeActive && styles.metronomeBtnActive,
            ]}
            onPress={toggleMetronome}
          >
            {isMetronomeActive ? (
              <StopCircle size={16} color={COLORS.alertRed} />
            ) : (
              <Zap size={16} color="#FFFFFF" />
            )}
            <Text
              style={[
                styles.metronomeBtnText,
                isMetronomeActive && { color: COLORS.alertRed },
              ]}
            >
              {isMetronomeActive ? 'Stop' : 'Start CPR'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ⚡ Quick Triage Prompt Chips */}
        <View style={styles.quickPromptsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickPromptsScroll}
          >
            {quickPrompts.map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.promptChip}
                activeOpacity={0.8}
                onPress={() => handleQuickPrompt(prompt)}
              >
                <Text style={styles.promptChipText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 💬 Chat Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble
              message={item}
              onSelectHospital={handleDirectBookFromAi}
            />
          )}
          contentContainerStyle={styles.chatListContent}
          ListFooterComponent={
            isLoading ? (
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>NVIDIA NIM assessing emergency vitals...</Text>
              </View>
            ) : null
          }
        />

        {/* ⌨️ Bottom Voice & Text Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.micBtn, isRecording && styles.micBtnRecording]}
            activeOpacity={0.8}
            onPress={handleVoiceInput}
          >
            {isRecording ? (
              <MicOff size={18} color="#FFFFFF" />
            ) : (
              <Mic size={18} color={COLORS.primaryDark} />
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder={isRecording ? 'Listening to voice...' : 'Describe patient symptoms, pain, age...'}
            placeholderTextColor={COLORS.textPlaceholder}
            value={inputVal}
            onChangeText={setInputVal}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              !inputVal.trim() && styles.sendBtnDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleSend}
            disabled={!inputVal.trim()}
          >
            <Send size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  liveAiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveAiBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  muteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteBtnActive: {
    backgroundColor: COLORS.primary,
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metronomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  metronomeBannerActive: {
    backgroundColor: COLORS.alertRed,
    borderBottomColor: COLORS.alertRed,
  },
  metronomeFlash: {
    backgroundColor: '#991B1B',
  },
  metronomeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  metronomeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.alertRed,
  },
  metronomeSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  metronomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.alertRed,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  metronomeBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  metronomeBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  quickPromptsWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  quickPromptsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  promptChip: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  promptChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  chatListContent: {
    padding: 14,
    paddingBottom: 20,
    gap: 12,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    gap: 8,
  },
  micBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnRecording: {
    backgroundColor: COLORS.alertRed,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 14,
    fontSize: 13,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.cardBorder,
  },
});
