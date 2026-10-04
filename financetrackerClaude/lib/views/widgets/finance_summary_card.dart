import 'package:flutter/material.dart';

String formatDollars(double v) => '\$${v.toStringAsFixed(2)}';

/// Card showing a labelled dollar amount, with an optional badge.
class FinanceSummaryCard extends StatelessWidget {
  final String label;
  final double amount;
  final Color? color;
  final String? badge;

  const FinanceSummaryCard({
    super.key,
    required this.label,
    required this.amount,
    this.color,
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final accent = color ?? theme.colorScheme.primary;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: theme.textTheme.labelMedium),
            const SizedBox(height: 4),
            Text(
              formatDollars(amount),
              style: theme.textTheme.titleLarge
                  ?.copyWith(color: accent, fontWeight: FontWeight.bold),
            ),
            if (badge != null) ...[
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(badge!,
                    style: theme.textTheme.labelSmall?.copyWith(color: accent)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
