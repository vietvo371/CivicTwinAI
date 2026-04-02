import React from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView } from 'react-native';
import {
  theme,
  COLORS,
  SPACING,
  textStyles,
  AegisCard,
  AegisButton,
} from '../theme';

const ThemePreviewScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={textStyles.h2}>Design System Preview</Text>
        <Text style={[textStyles.bodyMedium, { color: COLORS.textSecondary, marginBottom: SPACING.xl }]}>
          CivicTwinAI — Digital Twin Mobile Rebranding
        </Text>

        <Section title="Colors">
          <View style={styles.colorRow}>
            <ColorBox color={COLORS.primary} label="Primary" />
            <ColorBox color={COLORS.secondary} label="Secondary" />
            <ColorBox color={COLORS.accent} label="AI Accent" />
          </View>
          <View style={styles.colorRow}>
            <ColorBox color={COLORS.success} label="Success" />
            <ColorBox color={COLORS.warning} label="Warning" />
            <ColorBox color={COLORS.error} label="Error" />
          </View>
        </Section>

        <Section title="Aegis Cards">
          <AegisCard variant="default" style={styles.card}>
            <Text style={textStyles.h5}>Default Card</Text>
            <Text style={textStyles.bodySmall}>Standard surface with subtle shadow.</Text>
          </AegisCard>

          <AegisCard variant="elevated" style={styles.card}>
            <Text style={textStyles.h5}>Elevated Card</Text>
            <Text style={textStyles.bodySmall}>High-fidelity elevation for key items.</Text>
          </AegisCard>

          <AegisCard variant="glass" style={styles.card}>
            <Text style={textStyles.h5}>Glassmorphism</Text>
            <Text style={textStyles.bodySmall}>Integrated blur and transparency.</Text>
          </AegisCard>
        </Section>

        <Section title="Aegis Buttons">
          <AegisButton
            title="Primary Action"
            onPress={() => {}}
            style={styles.button}
          />
          <AegisButton
            title="AI Insight"
            onPress={() => {}}
            variant="secondary"
            gradient={theme.colors.gradientAI}
            icon="auto-fix"
            style={styles.button}
          />
          <AegisButton
            title="Outline Button"
            onPress={() => {}}
            variant="outline"
            style={styles.button}
          />
        </Section>

        <Section title="Typography">
          <Text style={textStyles.h1}>Heading H1</Text>
          <Text style={textStyles.h3}>Heading H3</Text>
          <Text style={textStyles.bodyLarge}>Body Large for important text.</Text>
          <Text style={textStyles.bodyMedium}>Body Medium for standard text.</Text>
          <Text style={textStyles.caption}>Caption text for footnotes.</Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
};

const Section = ({ title, children }: any) => (
  <View style={styles.section}>
    <Text style={[textStyles.overline, { marginBottom: SPACING.md, color: COLORS.primary }]}>
      {title}
    </Text>
    {children}
  </View>
);

const ColorBox = ({ color, label }: any) => (
  <View style={styles.colorBoxContainer}>
    <View style={[styles.colorBox, { backgroundColor: color }]} />
    <Text style={textStyles.labelSmall}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  section: {
    marginBottom: SPACING['3xl'],
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  colorBoxContainer: {
    alignItems: 'center',
    width: '30%',
  },
  colorBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.borderRadius.md,
    marginBottom: SPACING.xs,
  },
  card: {
    marginBottom: SPACING.md,
  },
  button: {
    marginBottom: SPACING.md,
  },
});

export default ThemePreviewScreen;
