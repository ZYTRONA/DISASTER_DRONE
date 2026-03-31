import { StyleSheet, Dimensions } from 'react-native';
import { Colors, THEME } from '../themes/colors';

const { width } = Dimensions.get('window');
const isMobile = width < 600;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingBottom: 32,
    minHeight: '100%',
  },
  section: {
    marginBottom: THEME.spacing.xxl,
  },
  sectionTitle: {
    fontSize: THEME.typography.size.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: THEME.spacing.lg,
  },
  // Card Containers - Glass Morphism
  cardsContainer: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  categoryCard: {
    flex: 1,
    borderRadius: THEME.borderRadius.xl,
    overflow: 'hidden',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCardInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: THEME.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  categoryIcon: {
    fontSize: 48,
    marginBottom: THEME.spacing.sm,
  },
  categoryName: {
    fontSize: THEME.typography.size.lg,
    fontWeight: '700',
    color: Colors.textInverse,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  // Helplines Section
  helplinesGrid: {
    gap: THEME.spacing.md,
  },
  helplineCard: {
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  helplineCardInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: THEME.borderRadius.lg,
    zIndex: 0,
  },
  helplineContent: {
    flex: 1,
    zIndex: 1,
  },
  helplineIcon: {
    fontSize: 24,
    zIndex: 1,
  },
  helplineName: {
    fontSize: THEME.typography.size.md,
    fontWeight: '700',
    color: Colors.textInverse,
    marginBottom: 2,
  },
  helplineNumber: {
    fontSize: THEME.typography.size.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  // Modal Styles - Glass Morphism
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: THEME.borderRadius.xl,
    borderTopRightRadius: THEME.borderRadius.xl,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  languageOption: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  languageOptionActive: {
    backgroundColor: Colors.glassAccent,
  },
  languageOptionText: {
    fontSize: THEME.typography.size.lg,
    color: Colors.textPrimary,
  },
  languageOptionTextActive: {
    fontWeight: '700',
    color: Colors.primary,
  },
  // Responsive Styles
  responsiveCardContainer: {
    marginHorizontal: isMobile ? THEME.spacing.sm : THEME.spacing.lg,
    marginVertical: isMobile ? THEME.spacing.sm : THEME.spacing.md,
  },
  responsivePadding: {
    padding: isMobile ? THEME.spacing.md : THEME.spacing.lg,
  },
});

export default styles;
