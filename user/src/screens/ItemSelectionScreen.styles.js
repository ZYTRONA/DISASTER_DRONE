import { StyleSheet } from 'react-native';
import { Colors, THEME, fw } from '../themes/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  backButton: {
    fontSize: THEME.typography.size.lg,
    fontWeight: fw(THEME.typography.weight.bold),
    color: Colors.textInverse,
  },
  headerTitle: {
    flex: 1,
    fontSize: THEME.typography.size.lg,
    fontWeight: fw(THEME.typography.weight.bold),
    color: Colors.textInverse,
  },
  listContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    ...THEME.shadow.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  itemIcon: {
    fontSize: 24,
  },
  itemName: {
    fontSize: THEME.typography.size.md,
    fontWeight: fw(THEME.typography.weight.bold),
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  itemUnit: {
    fontSize: THEME.typography.size.sm,
    color: Colors.textSecondary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: Colors.blue,
  },
  stepperBtnText: {
    fontSize: THEME.typography.size.lg,
    fontWeight: fw(THEME.typography.weight.bold),
    color: Colors.textInverse,
  },
  stepperValue: {
    fontSize: THEME.typography.size.md,
    fontWeight: fw(THEME.typography.weight.bold),
    color: Colors.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },
  noteBox: {
    backgroundColor: Colors.background,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
    padding: THEME.spacing.md,
    marginHorizontal: THEME.spacing.lg,
    marginVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  noteIcon: {
    fontSize: 16,
  },
  noteText: {
    flex: 1,
    fontSize: THEME.typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.lg,
  },
  cartLabel: {
    fontSize: THEME.typography.size.sm,
    color: Colors.textSecondary,
  },
  cartTotal: {
    fontSize: THEME.typography.size.xl,
    fontWeight: fw(THEME.typography.weight.bold),
    color: Colors.textPrimary,
  },
  submitBtn: {
    backgroundColor: Colors.blue,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: Colors.textInverse,
    fontSize: THEME.typography.size.md,
    fontWeight: fw(THEME.typography.weight.bold),
  },
});

export default styles;
