import { StyleSheet } from 'react-native';
import { Colors, THEME, fw } from '../themes/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef4ff',
  },
  content: {
    flex: 1,
    paddingHorizontal: THEME.spacing.lg,
  },
  contentContainer: {
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xxxl,
  },
  heroCard: {
    backgroundColor: '#0f4fc7',
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.xl,
    marginBottom: THEME.spacing.lg,
    ...THEME.shadow.lg,
  },
  heroIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  heroTitle: {
    fontSize: THEME.typography.size.h4,
    fontWeight: fw(THEME.typography.weight.bold),
    color: Colors.textInverse,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: THEME.typography.size.md,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 20,
    marginBottom: THEME.spacing.md,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
  },
  heroMetaChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
  },
  heroMetaLabel: {
    fontSize: THEME.typography.size.xs,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroMetaValue: {
    fontSize: THEME.typography.size.sm,
    color: Colors.textInverse,
    fontWeight: fw(THEME.typography.weight.bold),
  },
  statsRow: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#d9e3f7',
    ...THEME.shadow.sm,
  },
  statLabel: {
    fontSize: THEME.typography.size.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: THEME.typography.size.lg,
    color: Colors.textPrimary,
    fontWeight: fw(THEME.typography.weight.bold),
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: '#dde7fb',
    ...THEME.shadow.sm,
  },
  sectionTitle: {
    fontSize: THEME.typography.size.lg,
    fontWeight: fw(THEME.typography.weight.bold),
    color: Colors.textPrimary,
    marginBottom: THEME.spacing.sm,
  },
  orderItems: {
    gap: THEME.spacing.sm,
  },
  emptyOrderState: {
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    padding: THEME.spacing.md,
  },
  emptyOrderText: {
    fontSize: THEME.typography.size.sm,
    color: Colors.textSecondary,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    backgroundColor: '#f8fbff',
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#dce8ff',
  },
  qtyBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBadgeText: {
    color: Colors.textInverse,
    fontSize: THEME.typography.size.md,
    fontWeight: fw(THEME.typography.weight.bold),
  },
  itemIcon: {
    fontSize: 22,
  },
  orderMeta: {
    flex: 1,
  },
  orderItemName: {
    flex: 1,
    fontSize: THEME.typography.size.md,
    color: Colors.textPrimary,
    fontWeight: fw(THEME.typography.weight.medium),
  },
  orderItemUnit: {
    fontSize: THEME.typography.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  trackingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.sm,
  },
  trackingStepText: {
    fontSize: THEME.typography.size.sm,
    color: Colors.textSecondary,
    fontWeight: fw(THEME.typography.weight.bold),
  },
  timeline: {
    gap: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
  },
  stageCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  stageCircleInactive: {
    backgroundColor: '#edf2fb',
    borderColor: '#c5d2ea',
  },
  stageCircleActive: {
    backgroundColor: '#e4f8eb',
    borderColor: '#1faa5d',
  },
  stageIcon: {
    fontSize: 20,
  },
  stageInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  stageName: {
    fontSize: THEME.typography.size.md,
    fontWeight: fw(THEME.typography.weight.bold),
  },
  stageNameInactive: {
    color: '#64748b',
  },
  stageNameActive: {
    color: '#0f172a',
  },
  stageDesc: {
    fontSize: THEME.typography.size.sm,
  },
  stageDescInactive: {
    color: '#94a3b8',
  },
  stageDescActive: {
    color: '#475569',
  },
  connector: {
    position: 'absolute',
    left: 20,
    top: 42,
    bottom: -THEME.spacing.md,
    width: 2,
  },
  connectorInactive: {
    backgroundColor: '#d4deef',
  },
  connectorActive: {
    backgroundColor: '#1faa5d',
  },
  confirmBtn: {
    backgroundColor: '#0f4fc7',
    paddingVertical: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
    ...THEME.shadow.md,
  },
  confirmBtnText: {
    color: Colors.textInverse,
    fontSize: THEME.typography.size.lg,
    fontWeight: fw(THEME.typography.weight.bold),
  },
  finalMessage: {
    backgroundColor: '#ecfdf3',
    borderWidth: 1,
    borderColor: '#9de4bb',
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  finalText: {
    fontSize: THEME.typography.size.lg,
    fontWeight: fw(THEME.typography.weight.bold),
    color: '#11653a',
    marginTop: THEME.spacing.sm,
    marginBottom: 4,
  },
  finalSub: {
    fontSize: THEME.typography.size.md,
    color: '#2f7d55',
    textAlign: 'center',
  },
  helplines: {
    gap: THEME.spacing.md,
  },
  helplineBtn: {
    borderLeftWidth: 4,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#f8fbff',
    padding: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#dce8ff',
  },
  helplineIcon: {
    fontSize: 20,
  },
  helplineInfo: {
    flex: 1,
  },
  helplineName: {
    fontSize: THEME.typography.size.md,
    fontWeight: fw(THEME.typography.weight.bold),
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  helplinePhoneBtn: {
    fontSize: THEME.typography.size.sm,
    color: Colors.textSecondary,
    fontWeight: fw(THEME.typography.weight.bold),
  },
  newRequestBtn: {
    backgroundColor: '#2563eb',
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
    paddingVertical: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.shadow.md,
  },
  newRequestBtnText: {
    color: Colors.textInverse,
    fontSize: THEME.typography.size.lg,
    fontWeight: fw(THEME.typography.weight.bold),
  },
});

export default styles;
