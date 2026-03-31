import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { Colors } from '../../constants/colors';
import { Fonts, Type } from '../../constants/typography';

const foundersImage = require('../../assets/founders.png');

const FOUNDERS = [
  {
    name: 'Nick Perin',
    title: 'Co-Founder',
    bio: 'Holds the all-time single-session weight record at 4.1 lbs. Has never once apologized for it.',
  },
  {
    name: 'Aaron Sherman',
    title: 'Co-Founder & CEO',
    bio: 'Conceived U·Dump in 2016. Spent a decade waiting for the world to be ready. It still isn\'t.',
  },
  {
    name: 'Shelden Rahman',
    title: 'Co-Founder & Chief Throne Officer',
    bio: 'The operational backbone. Makes sure the data flows, the thrones are mapped, and Bobby stays last.',
  },
];

export default function FoundersScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.void, Colors.base]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.gold} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>OUR FOUNDERS</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={foundersImage}
            style={styles.foundersImage}
            resizeMode="contain"
          />

          <View style={styles.namesRow}>
            <Text style={styles.nameLabel}>Nick</Text>
            <Text style={styles.nameLabel}>Aaron</Text>
            <Text style={styles.nameLabel}>Shelden</Text>
          </View>

          <GlassCard style={styles.letterCard}>
            <View style={styles.letterContent}>
              <Text style={styles.letterLabel}>A MESSAGE FROM OUR FOUNDERS</Text>
              <Text style={styles.letterText}>
                Thank you for being an early believer in what we{"'"}re building. We vow to make your bathroom experience the most tracked, most competitive, and most dignified part of your day.
              </Text>
              <Text style={styles.letterText}>
                Every flush is a data point. Every session, a step toward greatness. We built this for you — and honestly, for ourselves. We needed this.
              </Text>
              <Text style={styles.letterText}>
                U{"·"}Dump was originally conceived in 2016 as a Kickstarter project. Reddit called it {"\""}the best shitty Kickstarter{"\""}. We took that as a compliment. A decade later, the vision is finally complete — rebuilt from scratch, no compromises, no apologies.
              </Text>
              <Text style={styles.letterSig}>— The U{"·"}Dump Founding Team</Text>
            </View>
          </GlassCard>

          {FOUNDERS.map((founder) => (
            <GlassCard key={founder.name} style={styles.founderCard}>
              <View style={styles.founderContent}>
                <View style={styles.founderHeader}>
                  <Text style={styles.founderName}>{founder.name}</Text>
                  <Text style={styles.founderTitle}>{founder.title}</Text>
                </View>
                <Text style={styles.founderBio}>{founder.bio}</Text>
              </View>
            </GlassCard>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerLogo}>U{"·"}DUMP</Text>
            <Text style={styles.footerTagline}>Originally conceived 2016. Finally shipped 2026.</Text>
            <Text style={styles.footerLine}>You{"'"}re welcome.</Text>
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.glass2,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Type.label,
    color: Colors.gold,
    fontSize: 12,
    letterSpacing: 2,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  foundersImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
  },
  namesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  nameLabel: {
    fontFamily: Fonts.bodySemiBoldFamily,
    fontSize: 14,
    color: Colors.text2,
    letterSpacing: 0.5,
  },
  letterCard: {
    padding: 0,
  },
  letterContent: {
    padding: 20,
    gap: 14,
  },
  letterLabel: {
    ...Type.label,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 2,
  },
  letterText: {
    ...Type.body,
    color: Colors.text2,
    fontSize: 14,
    lineHeight: 22,
  },
  letterSig: {
    ...Type.body,
    color: Colors.gold,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  founderCard: {
    padding: 0,
  },
  founderContent: {
    padding: 18,
    gap: 8,
  },
  founderHeader: {
    gap: 2,
  },
  founderName: {
    fontFamily: Fonts.displaySemiBoldFamily,
    fontSize: 18,
    color: Colors.text1,
  },
  founderTitle: {
    ...Type.label,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1,
  },
  founderBio: {
    ...Type.body,
    color: Colors.text3,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 24,
  },
  footerLogo: {
    fontFamily: Fonts.displayFamily,
    fontSize: 24,
    color: Colors.gold,
    letterSpacing: 4,
  },
  footerTagline: {
    ...Type.body,
    color: Colors.text3,
    fontSize: 12,
    fontStyle: 'italic',
  },
  footerLine: {
    ...Type.body,
    color: Colors.text3,
    fontSize: 11,
  },
  bottomPad: {
    height: 40,
  },
});
