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
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
  },
  themeInfoText: {
    fontSize: THEME.typography.size.md,
    color: Colors.textPrimary,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
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
