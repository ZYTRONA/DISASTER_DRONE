import { StyleSheet } from 'react-native';
import { Colors, THEME } from '../themes/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.error,
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  headerSmall: {
    fontSize: THEME.typography.size.xs,
    fontWeight: '500',
    color: 'rgba(255,255,255,.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: THEME.typography.size.h2,
    fontWeight: '900',
    color: Colors.textInverse,
    marginBottom: 4,
  },
  langButton: {
    backgroundColor: 'rgba(255,255,255,.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,.35)',
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langButtonText: {
    color: Colors.textInverse,
    fontSize: THEME.typography.size.sm,
    fontWeight: '700',
  },
  settingsButton: {
    backgroundColor: 'rgba(255,255,255,.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,.35)',
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeGroup: {
    borderWidth: 1.5,
    borderRadius: THEME.borderRadius.md,
    flexDirection: 'row',
    padding: 2,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.sm,
  },
  themeOptionActive: {
    backgroundColor: '#ffffff',
  },
  themeText: {
    fontSize: THEME.typography.size.xs,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
  },
  contentContainer: {
    paddingBottom: 20,
    minHeight: '100%',
  },
  section: {
    marginBottom: THEME.spacing.xxl,
  },
  sectionTitle: {
    fontSize: THEME.typography.size.sm,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: THEME.spacing.md,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  categoryCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: THEME.typography.size.lg,
    fontWeight: '700',
  },
  categoryLabelWrap: {
    justifyContent: 'center',
  },
  helplinesGrid: {
    gap: THEME.spacing.md,
  },
  helplineCard: {
    borderLeftWidth: 4,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: Colors.surface,
    padding: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    ...THEME.shadow.sm,
  },
  helplineIcon: {
    fontSize: 20,
  },
  helplineName: {
    fontSize: THEME.typography.size.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  helplineNumber: {
    fontSize: THEME.typography.size.sm,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: THEME.borderRadius.xl,
    borderTopRightRadius: THEME.borderRadius.xl,
    maxHeight: '70%',
  },
  languageOption: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  languageOptionActive: {
    backgroundColor: Colors.background,
  },
  languageOptionText: {
    fontSize: THEME.typography.size.lg,
    color: Colors.textPrimary,
  },
  languageOptionTextActive: {
    fontWeight: '700',
    color: Colors.blue,
  },
});

export default styles;
