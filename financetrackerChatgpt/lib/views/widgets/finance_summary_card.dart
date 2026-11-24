import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class FinanceSummaryCard extends StatelessWidget {
  const FinanceSummaryCard({
    required this.label,
    required this.amount,
    required this.icon,
    required this.color,
    this.caption,
    super.key,
  });

  final String label;
  final double amount;
  final IconData icon;
  final Color color;
  final String? caption;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: color.withValues(alpha: 0.12),
              foregroundColor: color,
              child: Icon(icon),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: Theme.of(context).textTheme.labelLarge),
                  const SizedBox(height: 2),
                  Text(
                    NumberFormat.simpleCurrency().format(amount),
                    style: Theme.of(context).textTheme.titleLarge
                        ?.copyWith(fontWeight: FontWeight.bold, color: color),
                  ),
                  if (caption != null)
                    Text(
                      caption!,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
