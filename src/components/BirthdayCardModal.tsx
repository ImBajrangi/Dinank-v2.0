import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Share,
  Platform,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  Path,
  G,
} from 'react-native-svg';
import {
  X,
  Share2,
  Copy,
  MessageCircle,
  Sparkles,
  Check,
  GraduationCap,
  Heart,
  PartyPopper,
  Briefcase,
  Leaf,
  Moon,
  Edit3,
  Flame,
  Award,
} from 'lucide-react-native';
import { CalculatedBirthday } from '../types/birthday';
import { useBirthdays } from '../context/BirthdayContext';
import { AppLogo } from './AppLogo';
import { ActionService } from '../services/actions';

interface BirthdayCardModalProps {
  visible: boolean;
  onClose: () => void;
  birthday: CalculatedBirthday | null;
}

interface CardTheme {
  id: string;
  name: string;
  categoryTag: string;
  badgeLabel: string;
  accentIcon: string;
  gradientColors: [string, string, string];
  textColor: string;
  subtextColor: string;
  quoteColor: string;
  cardBorderColor: string;
  pillBg: string;
  glowColor: string;
  quotes: string[];
}

const CARD_THEMES: CardTheme[] = [
  {
    id: 'student-sapphire',
    name: 'Academic Star',
    categoryTag: 'student',
    badgeLabel: '🎓 Academic Excellence',
    accentIcon: 'graduation',
    gradientColors: ['#0F2B66', '#1E40AF', '#3B82F6'],
    textColor: '#FFFFFF',
    subtextColor: '#93C5FD',
    quoteColor: '#DBEAFE',
    cardBorderColor: 'rgba(147, 197, 253, 0.35)',
    pillBg: 'rgba(15, 23, 42, 0.45)',
    glowColor: '#60A5FA',
    quotes: [
      'May this milestone year bring brilliance, high achievements, and great wisdom to your educational journey. Keep shining bright!',
      'Wishing a stellar academic year ahead packed with success, curiosity, and incredible triumphs! Happy Birthday!',
      "Here's to big dreams, relentless hard work, and achieving every goal you set your eyes on! Have a magnificent celebration!",
    ],
  },
  {
    id: 'family-rose',
    name: 'Sunset Blessings',
    categoryTag: 'family',
    badgeLabel: '❤️ Family & Love',
    accentIcon: 'heart',
    gradientColors: ['#701A45', '#9D174D', '#E11D48'],
    textColor: '#FFFFFF',
    subtextColor: '#FECDD3',
    quoteColor: '#FFE4E6',
    cardBorderColor: 'rgba(254, 205, 211, 0.35)',
    pillBg: 'rgba(136, 19, 55, 0.45)',
    glowColor: '#FB7185',
    quotes: [
      'Having you in our family is a true blessing every single day. Wishing you endless happiness, vibrant health, and boundless love!',
      'Happy Birthday to someone who makes life so wonderful and meaningful. May this year shower you with peace, love, and joy!',
      'A very special birthday wish for an irreplaceable soul. Thank you for your warmth and love. Have a glorious celebration!',
    ],
  },
  {
    id: 'friend-fiesta',
    name: 'Electric Fiesta',
    categoryTag: 'friend',
    badgeLabel: '🎉 Bestie & Celebration',
    accentIcon: 'party',
    gradientColors: ['#3B0764', '#6D28D9', '#C026D3'],
    textColor: '#FFFFFF',
    subtextColor: '#F5D0FE',
    quoteColor: '#FAE8FF',
    cardBorderColor: 'rgba(245, 208, 254, 0.35)',
    pillBg: 'rgba(88, 28, 135, 0.45)',
    glowColor: '#E879F9',
    quotes: [
      'Happy Birthday to my favorite person! May your year ahead be packed with endless adventures, big laughs, and unforgettable memories!',
      "Cheers to another year of legendary moments, crazy stories, and unstoppable laughter! Let's celebrate your day in style!",
      'To an amazing friend who lights up every room: wishing you the happiest, most epic birthday celebration ever! 🎂✨',
    ],
  },
  {
    id: 'work-prestige',
    name: 'Golden Prestige',
    categoryTag: 'work',
    badgeLabel: '🌟 Prestige & Leadership',
    accentIcon: 'briefcase',
    gradientColors: ['#1C1917', '#451A03', '#B45309'],
    textColor: '#FFFFFF',
    subtextColor: '#FDE68A',
    quoteColor: '#FEF3C7',
    cardBorderColor: 'rgba(253, 230, 138, 0.35)',
    pillBg: 'rgba(28, 25, 23, 0.65)',
    glowColor: '#FBBF24',
    quotes: [
      'Wishing you a remarkable birthday filled with new achievements, continued leadership, and inspiring success in all your endeavors.',
      'It is a genuine privilege to collaborate with someone of your caliber and dedication. Wishing you a prosperous year ahead!',
      'Warmest birthday greetings! May this milestone year bring you exceptional triumphs and fulfillment in your career and life.',
    ],
  },
  {
    id: 'nature-emerald',
    name: 'Emerald Aurora',
    categoryTag: 'other',
    badgeLabel: '🌿 Vitality & Peace',
    accentIcon: 'leaf',
    gradientColors: ['#064E3B', '#047857', '#059669'],
    textColor: '#FFFFFF',
    subtextColor: '#A7F3D0',
    quoteColor: '#D1FAE5',
    cardBorderColor: 'rgba(167, 243, 208, 0.35)',
    pillBg: 'rgba(6, 78, 59, 0.55)',
    glowColor: '#34D399',
    quotes: [
      'May your life be graced with good health, deep peace of mind, and everlasting joy. Wishing you a blessed and serene birthday!',
      'Celebrating the wonderful light you bring into the world. May your days be filled with harmony, continuous growth, and happiness.',
      'Wishing you an inspiring birthday surrounded by beauty, laughter, and the warmth of the people who cherish you!',
    ],
  },
  {
    id: 'cosmic-starlight',
    name: 'Cosmic Starlight',
    categoryTag: 'other',
    badgeLabel: '✨ Dreamer & Star',
    accentIcon: 'moon',
    gradientColors: ['#0B0F19', '#1E1B4B', '#4338CA'],
    textColor: '#FFFFFF',
    subtextColor: '#C7D2FE',
    quoteColor: '#E0E7FF',
    cardBorderColor: 'rgba(199, 210, 254, 0.35)',
    pillBg: 'rgba(11, 15, 25, 0.65)',
    glowColor: '#818CF8',
    quotes: [
      'The universe celebrates your existence today! May you reach for the stars, break every barrier, and make your biggest dreams come true!',
      'Another year around the sun for a truly remarkable human. Keep being your authentic, brilliant, and inspiring self!',
      'May the year ahead open doors to breathtaking possibilities, deep fulfillment, and pure happiness. Happy Birthday!',
    ],
  },
];

export const BirthdayCardModal: React.FC<BirthdayCardModalProps> = ({
  visible,
  onClose,
  birthday,
}) => {
  const { colors, isDark, settings } = useBirthdays();
  const screenWidth = Dimensions.get('window').width;

  // Selected theme & custom state
  const [selectedThemeIndex, setSelectedThemeIndex] = useState<number>(0);
  const [selectedQuoteIndex, setSelectedQuoteIndex] = useState<number>(0);
  const [customSender, setCustomSender] = useState<string>('');
  const [isEditingQuote, setIsEditingQuote] = useState<boolean>(false);
  const [customQuoteText, setCustomQuoteText] = useState<string>('');
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  // Initialize theme based on birthday relationship
  useEffect(() => {
    if (!birthday) return;

    const rel = (birthday.relationship || 'other').toLowerCase();
    let themeIndex = 0;

    if (rel === 'student') {
      themeIndex = 0; // Academic Star
    } else if (rel === 'family') {
      themeIndex = 1; // Sunset Rose
    } else if (rel === 'friend') {
      themeIndex = 2; // Electric Fiesta
    } else if (rel === 'work') {
      themeIndex = 3; // Golden Prestige
    } else {
      themeIndex = 5; // Cosmic Starlight
    }

    setSelectedThemeIndex(themeIndex);
    setSelectedQuoteIndex(0);
    setCustomQuoteText('');
    setIsEditingQuote(false);
    setCustomSender(settings?.senderName || '');
  }, [birthday, settings?.senderName]);

  if (!birthday) return null;

  const currentTheme = CARD_THEMES[selectedThemeIndex] || CARD_THEMES[0];
  const activeQuote =
    customQuoteText.trim().length > 0
      ? customQuoteText
      : currentTheme.quotes[selectedQuoteIndex] || currentTheme.quotes[0];

  const senderName = customSender.trim() || settings?.senderName || 'Your Well-Wisher';

  // Format date nicely
  const [, m, d] = birthday.birthDate.split('-');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const dateFormatted = `${parseInt(d, 10)} ${monthNames[parseInt(m, 10) - 1]}`;

  const academicDetail = [
    birthday.groupClass ? `Class ${birthday.groupClass}` : null,
    birthday.section ? `Sec ${birthday.section}` : null,
    birthday.rollNo ? `Roll No. ${birthday.rollNo}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  // Generate formatted text representation for WhatsApp / Sharing
  const getFullShareText = () => {
    const ageText = birthday.nextAge ? ` (Turning ${birthday.nextAge})` : '';
    const classInfo = academicDetail ? `\n📚 *${academicDetail}*` : '';

    return `🎂 *HAPPY BIRTHDAY ${birthday.name.toUpperCase()}!* 🎉${ageText}
📅 *Date:* ${dateFormatted}${classInfo}

"${activeQuote}"

Warmest wishes with love & blessings,
✨ *${senderName}*

━━━━━━━━━━━━━━━━━━━━━
📲 *Shared with Dinank*
_Never miss a birthday, anniversary or special moment._`;
  };

  // WhatsApp Share
  const handleShareWhatsApp = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    const message = getFullShareText();
    await ActionService.sendWhatsApp(birthday.phone, message, birthday.name);
  };

  // System Share Sheet
  const handleShareSystem = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    const message = getFullShareText();
    try {
      await Share.share({
        title: `Birthday Card for ${birthday.name}`,
        message: message,
      });
    } catch (err) {}
  };

  // Copy text to clipboard
  const handleCopyText = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    const message = getFullShareText();
    try {
      if (Clipboard && Clipboard.setStringAsync) {
        await Clipboard.setStringAsync(message);
      }
    } catch (e) {}

    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2200);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? '#0A0A0C' : '#F2F2F7',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
            },
          ]}
        >
          {/* Grabber */}
          <View style={styles.grabberWrapper}>
            <View
              style={[
                styles.grabber,
                { backgroundColor: isDark ? '#3A3A3C' : '#D1D1D6' },
              ]}
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Sparkles size={20} color="#FF9500" />
              <Text
                style={[
                  styles.headerTitle,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}
              >
                Customized Birthday Card
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <X size={18} color={isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>

          {/* Main Scroll Content */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {/* LIVE CARD PREVIEW */}
            <View style={styles.cardPreviewContainer}>
              <View
                style={[
                  styles.cardShadowWrapper,
                  {
                    shadowColor: currentTheme.glowColor,
                  },
                ]}
              >
                <View
                  style={[
                    styles.cardFrame,
                    {
                      borderColor: currentTheme.cardBorderColor,
                    },
                  ]}
                >
                  {/* SVG Gradient Background & Decorative Elements */}
                  <Svg
                    style={StyleSheet.absoluteFill}
                    width="100%"
                    height="100%"
                    viewBox="0 0 340 420"
                  >
                    <Defs>
                      <LinearGradient
                        id={`cardGrad-${currentTheme.id}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <Stop
                          offset="0%"
                          stopColor={currentTheme.gradientColors[0]}
                        />
                        <Stop
                          offset="50%"
                          stopColor={currentTheme.gradientColors[1]}
                        />
                        <Stop
                          offset="100%"
                          stopColor={currentTheme.gradientColors[2]}
                        />
                      </LinearGradient>
                    </Defs>

                    {/* Gradient Fill */}
                    <Rect
                      x="0"
                      y="0"
                      width="340"
                      height="420"
                      fill={`url(#cardGrad-${currentTheme.id})`}
                    />

                    {/* Atmospheric Glow Circles */}
                    <Circle
                      cx="290"
                      cy="40"
                      r="100"
                      fill="#FFFFFF"
                      fillOpacity="0.08"
                    />
                    <Circle
                      cx="40"
                      cy="380"
                      r="90"
                      fill="#FFFFFF"
                      fillOpacity="0.05"
                    />

                    {/* Subtle Sparkle Stars */}
                    <G fill="#FFFFFF" fillOpacity="0.3">
                      <Circle cx="45" cy="55" r="2.5" />
                      <Circle cx="300" cy="180" r="2" />
                      <Circle cx="280" cy="320" r="3" />
                      <Circle cx="70" cy="260" r="1.5" />
                    </G>
                  </Svg>

                  {/* Top Badge & Date Pill */}
                  <View style={styles.cardHeaderRow}>
                    <View
                      style={[
                        styles.badgePill,
                        { backgroundColor: currentTheme.pillBg },
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {currentTheme.badgeLabel}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.datePill,
                        { backgroundColor: currentTheme.pillBg },
                      ]}
                    >
                      <Text style={styles.dateText}>{dateFormatted}</Text>
                    </View>
                  </View>

                  {/* Recipient Name Hero Section */}
                  <View style={styles.cardHeroSection}>
                    <Text
                      style={[
                        styles.cardHappyText,
                        { color: currentTheme.subtextColor },
                      ]}
                    >
                      HAPPY BIRTHDAY
                    </Text>
                    <Text
                      style={[
                        styles.cardRecipientName,
                        { color: currentTheme.textColor },
                      ]}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                    >
                      {birthday.name}
                    </Text>

                    {/* Age / Category Tagline */}
                    <View style={styles.cardTaglineRow}>
                      {birthday.nextAge ? (
                        <View
                          style={[
                            styles.ageTag,
                            { backgroundColor: 'rgba(255,255,255,0.2)' },
                          ]}
                        >
                          <Flame size={12} color="#FFE066" />
                          <Text style={styles.ageTagText}>
                            Turning {birthday.nextAge}
                          </Text>
                        </View>
                      ) : null}

                      {academicDetail ? (
                        <View
                          style={[
                            styles.ageTag,
                            { backgroundColor: 'rgba(255,255,255,0.18)' },
                          ]}
                        >
                          <Award size={12} color="#93C5FD" />
                          <Text style={styles.ageTagText}>
                            {academicDetail}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Inspiring Quote Box */}
                  <View
                    style={[
                      styles.quoteCardBox,
                      { backgroundColor: currentTheme.pillBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.quoteText,
                        { color: currentTheme.quoteColor },
                      ]}
                    >
                      "{activeQuote}"
                    </Text>
                  </View>

                  {/* Card Bottom: Sender Signature & DINANK APP CORNER BRAND */}
                  <View style={styles.cardFooterRow}>
                    {/* Sender Signature */}
                    <View style={styles.senderContainer}>
                      <Text style={styles.senderSub}>With warm wishes,</Text>
                      <Text
                        style={[
                          styles.senderName,
                          { color: currentTheme.textColor },
                        ]}
                        numberOfLines={1}
                      >
                        {senderName}
                      </Text>
                    </View>

                    {/* DINANK APP CORNER BRANDING BADGE */}
                    <View style={styles.brandCornerBadge}>
                      <View style={styles.brandIconGlass}>
                        <AppLogo size={14} color="#FFFFFF" eyeColor="#000000" />
                      </View>
                      <View style={styles.brandTextCol}>
                        <Text style={styles.brandTitle}>Dinank</Text>
                        <Text style={styles.brandSubtitle}>Birthday App</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* THEME SELECTION PALETTE */}
            <View style={styles.controlSection}>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: isDark ? '#A1A1AA' : '#6B7280' },
                ]}
              >
                SELECT CARD THEME
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.themeScrollList}
              >
                {CARD_THEMES.map((theme, idx) => {
                  const isSelected = selectedThemeIndex === idx;
                  return (
                    <TouchableOpacity
                      key={theme.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch (e) {}
                        setSelectedThemeIndex(idx);
                        setSelectedQuoteIndex(0);
                      }}
                      style={[
                        styles.themeItemCard,
                        {
                          borderColor: isSelected
                            ? '#0A84FF'
                            : isDark
                            ? 'rgba(255,255,255,0.1)'
                            : 'rgba(0,0,0,0.08)',
                          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.themeColorDot,
                          { backgroundColor: theme.gradientColors[1] },
                        ]}
                      />
                      <Text
                        style={[
                          styles.themeItemText,
                          {
                            color: isDark ? '#FFFFFF' : '#000000',
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {theme.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.themeCheckmark}>
                          <Check size={12} color="#0A84FF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* INSPIRING WISH CHOOSER */}
            <View style={styles.controlSection}>
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: isDark ? '#A1A1AA' : '#6B7280' },
                  ]}
                >
                  CARD MESSAGE & QUOTE
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsEditingQuote(!isEditingQuote)}
                  style={styles.editQuoteBtn}
                >
                  <Edit3 size={13} color="#0A84FF" />
                  <Text style={styles.editQuoteBtnText}>
                    {isEditingQuote ? 'Done Editing' : 'Custom Text'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isEditingQuote ? (
                <View
                  style={[
                    styles.customInputBox,
                    {
                      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(0,0,0,0.1)',
                    },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.customTextInput,
                      { color: isDark ? '#FFFFFF' : '#000000' },
                    ]}
                    placeholder="Write a custom personalized birthday message..."
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    multiline
                    numberOfLines={3}
                    value={customQuoteText}
                    onChangeText={setCustomQuoteText}
                  />
                </View>
              ) : (
                <View style={styles.quotesList}>
                  {currentTheme.quotes.map((q, idx) => {
                    const isSelected =
                      selectedQuoteIndex === idx &&
                      customQuoteText.trim().length === 0;
                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.75}
                        onPress={() => {
                          try {
                            Haptics.selectionAsync();
                          } catch (e) {}
                          setSelectedQuoteIndex(idx);
                          setCustomQuoteText('');
                        }}
                        style={[
                          styles.quoteOptionItem,
                          {
                            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                            borderColor: isSelected
                              ? '#0A84FF'
                              : isDark
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(0,0,0,0.06)',
                            borderWidth: isSelected ? 1.5 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.quoteOptionText,
                            {
                              color: isSelected
                                ? isDark
                                  ? '#FFFFFF'
                                  : '#0F172A'
                                : isDark
                                ? '#9CA3AF'
                                : '#6B7280',
                            },
                          ]}
                          numberOfLines={2}
                        >
                          "{q}"
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* SENDER SIGNATURE FIELD */}
            <View style={styles.controlSection}>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: isDark ? '#A1A1AA' : '#6B7280' },
                ]}
              >
                YOUR SIGNATURE / SENDER NAME
              </Text>
              <View
                style={[
                  styles.senderInputRow,
                  {
                    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                    borderColor: isDark
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(0,0,0,0.1)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.senderPrefix,
                    { color: isDark ? '#71717A' : '#9CA3AF' },
                  ]}
                >
                  From:
                </Text>
                <TextInput
                  style={[
                    styles.senderInput,
                    { color: isDark ? '#FFFFFF' : '#000000' },
                  ]}
                  placeholder="e.g. Harsh, Class Teacher, Rohit"
                  placeholderTextColor={isDark ? '#71717A' : '#9CA3AF'}
                  value={customSender}
                  onChangeText={setCustomSender}
                />
              </View>
            </View>

            {/* ACTION BUTTONS */}
            <View style={styles.actionButtonsContainer}>
              {/* WhatsApp Share Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleShareWhatsApp}
                style={[styles.primaryActionBtn, { backgroundColor: '#25D366' }]}
              >
                <MessageCircle size={20} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>
                  Send Card via WhatsApp
                </Text>
              </TouchableOpacity>

              {/* Secondary Action Row: System Share & Copy */}
              <View style={styles.secondaryActionRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleShareSystem}
                  style={[
                    styles.secondaryActionBtn,
                    {
                      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(0,0,0,0.1)',
                    },
                  ]}
                >
                  <Share2
                    size={17}
                    color={isDark ? '#FFFFFF' : '#0F172A'}
                  />
                  <Text
                    style={[
                      styles.secondaryActionText,
                      { color: isDark ? '#FFFFFF' : '#0F172A' },
                    ]}
                  >
                    Share Sheet
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleCopyText}
                  style={[
                    styles.secondaryActionBtn,
                    {
                      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(0,0,0,0.1)',
                    },
                  ]}
                >
                  <Copy size={17} color={isDark ? '#FFFFFF' : '#0F172A'} />
                  <Text
                    style={[
                      styles.secondaryActionText,
                      { color: isDark ? '#FFFFFF' : '#0F172A' },
                    ]}
                  >
                    {copiedToast ? 'Copied! ✓' : 'Copy Text'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '92%',
    maxHeight: '94%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  grabberWrapper: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    width: '100%',
  },
  grabber: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  /* Card Preview Box */
  cardPreviewContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  cardShadowWrapper: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
      },
      default: {
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  cardFrame: {
    width: '100%',
    minHeight: 380,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  datePill: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },

  /* Hero Section */
  cardHeroSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  cardHappyText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardRecipientName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: 8,
  },
  cardTaglineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  ageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ageTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Quote Box */
  quoteCardBox: {
    borderRadius: 16,
    padding: 14,
    marginVertical: 8,
  },
  quoteText: {
    fontSize: 13.5,
    lineHeight: 19,
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '500',
  },

  /* Footer & Brand */
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  senderContainer: {
    flex: 1,
  },
  senderSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  senderName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },

  /* DINANK CORNER BRANDING BADGE */
  brandCornerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  brandIconGlass: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
    marginTop: -1,
  },

  /* Controls */
  controlSection: {
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  editQuoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editQuoteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0A84FF',
  },

  /* Theme Horizontal Selector */
  themeScrollList: {
    gap: 8,
    paddingVertical: 2,
  },
  themeItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  themeColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  themeItemText: {
    fontSize: 13,
  },
  themeCheckmark: {
    marginLeft: 2,
  },

  /* Quotes List */
  quotesList: {
    gap: 8,
  },
  quoteOptionItem: {
    padding: 12,
    borderRadius: 12,
  },
  quoteOptionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  customInputBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  customTextInput: {
    fontSize: 13.5,
    lineHeight: 19,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  /* Sender Input */
  senderInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  senderPrefix: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  senderInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },

  /* Action Buttons */
  actionButtonsContainer: {
    marginTop: 22,
    gap: 10,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
      },
      default: {
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  secondaryActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
