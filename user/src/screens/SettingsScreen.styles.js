import { StyleSheet } from 'react-native';
import { Colors, THEME, fw } from '../themes/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingVertical: THEME.spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    backgroundColor: Colors.primary,
  },
  backButton: {
    fontSize: THEME.typography.size.lg,
    fontWeight: fw(THEME.typography.weight.bold),
    color: Colors.textInverse,
  },
  headerTitle: {
    fontSize: THEME.typography.size.lg,
    fontWeight: fw(THEME.typography.weight.bold),
    color: Colors.textInverse,
  },
  section: {
    marginHorizontal: THEME.spacing.lg,
    marginVertical: THEME.spacing.md,
  },
  sectionTitle: {
    fontSize: THEME.typography.size.md,
    fontWeight: fw(THEME.typography.weight.bold),
    color: Colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  themeRow: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  themeBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  themeBtnActive: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  themeBtnText: {
    fontSize: THEME.typography.size.md,
    fontWeight: fw(THEME.typography.weight.bold),
    color: Colors.textPrimary,
  },
  themeBtnTextActive: {
    color: Colors.textInverse,
  },
  themeInfoCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
  },
  themeInfoText: {
    fontSize: THEME.typography.size.md,
    color: '#000000',
    fontWeight: fw(THEME.typography.weight.medium),
  },
  urlDisplay: {
    backgroundColor: Colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  urlText: {
    fontSize: THEME.typography.size.sm,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    fontSize: THEME.typography.size.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.md,
  },
  presetBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: THEME.spacing.sm,
    ...THEME.shadow.sm,
  },
  presetLabel: {
    fontSize: THEME.typography.size.md,
    fontWeight: fw(THEME.typography.weight.bold),
    color: Colors.textPrimary,
  },
  presetUrl: {
    fontSize: THEME.typography.size.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  infoBox: {
    marginHorizontal: THEME.spacing.lg,
    marginVertical: THEME.spacing.md,
    backgroundColor: Colors.info + '15',
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
  },
  infoTitle: {
    fontSize: THEME.typography.size.md,
    fontWeight: fw(THEME.typography.weight.bold),
    color: Colors.info,
    marginLeft: THEME.spacing.sm,
  },
  infoText: {
    fontSize: THEME.typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: fw(THEME.typography.weight.bold),
    color: Colors.textPrimary,
  },
  statusBox: {
    marginHorizontal: THEME.spacing.lg,
    marginVertical: THEME.spacing.md,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusText: {
    fontSize: THEME.typography.size.sm,
    fontWeight: fw(THEME.typography.weight.bold),
  },
  buttonContainer: {
    marginHorizontal: THEME.spacing.lg,
    marginVertical: THEME.spacing.lg,
    gap: THEME.spacing.md,
  },
  btn: {
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtn: {
    backgroundColor: Colors.info,
  },
  saveBtn: {
    backgroundColor: Colors.success,
  },
  resetBtn: {
    backgroundColor: Colors.error,
  },
  btnText: {
    fontSize: THEME.typography.size.md,
    fontWeight: fw(THEME.typography.weight.bold),
    color: Colors.textInverse,
  },
});

export default styles;
